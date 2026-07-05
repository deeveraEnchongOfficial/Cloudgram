import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { listFiles, uploadFile } from '@/lib/telegram/files';
import { resolvePeer, listFolders, createFolder } from '@/lib/telegram/folders';
import { prisma } from '@/lib/db/prisma';
import { fileListQuerySchema } from '@/lib/security/validation';
import { initProgress, updateProgress, completeProgress } from '@/lib/upload/progress';
import { trackUploadBytes } from '@/lib/db/queries/bandwidth';
import { TELEGRAM_FOLDER_PREFIX } from '@/lib/constants';
import type { FileMetadata } from '@/types/file';
import type { PaginatedResponse } from '@/types/file';

function sortFiles(files: FileMetadata[], sortBy: string, sortOrder: string): FileMetadata[] {
  const sorted = [...files];
  const ascending = sortOrder === 'asc';

  sorted.sort((a, b) => {
    if (sortBy === 'name') {
      return ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === 'size') {
      return ascending ? a.size - b.size : b.size - a.size;
    }
    return ascending ? a.date.getTime() - b.date.getTime() : b.date.getTime() - a.date.getTime();
  });

  return sorted;
}

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request);
    const { searchParams } = new URL(request.url);
    const params = fileListQuerySchema.parse(Object.fromEntries(searchParams));

    const client = await getClient(session.userId);

    let folderId = params.folderId;
    if (!folderId) {
      const folders = await listFolders(client);
      if (folders.length === 0) {
        return Response.json({ success: true, data: [], pagination: { cursor: null, limit: params.limit, hasMore: false } });
      }
      const firstFolder = folders[0];
      const folderMapping = await prisma.folderMapping.findFirst({
        where: { userId: session.userId, channelId: firstFolder.channelId },
      });
      folderId = folderMapping?.id;
    }

    if (!folderId) {
      return Response.json({ success: true, data: [], pagination: { cursor: null, limit: params.limit, hasMore: false } });
    }

    const peer = await resolvePeer(client, session.userId, folderId);
    const messages = await client.getMessages(peer, {
      limit: params.limit,
      offsetId: params.cursor,
    });

    console.log('[files GET] Messages count:', messages.length, 'Peer type:', (peer as any)?.className ?? typeof peer);

    const files = messages
      .map((m: any) => {
        if (!m?.media) return null;
        const media = m.media;
        let name = 'Unknown';
        let size = 0;
        let mimeType = 'application/octet-stream';

        if (media.document) {
          const doc = media.document;
          size = parseInt(doc.size?.toString() || '0');
          mimeType = doc.mimeType || 'application/octet-stream';
          const fileNameAttr = doc.attributes?.find((a: any) => a.className === 'DocumentAttributeFilename');
          name = fileNameAttr?.fileName ?? `file_${m.id}.${mimeType.split('/').pop()}`;
        } else if (media.photo) {
          name = `photo_${m.id}.jpg`;
          mimeType = 'image/jpeg';
        } else {
          console.log('[files GET] Unknown media type:', media.className);
          return null;
        }

        return {
          id: m.id,
          name,
          size,
          mimeType,
          date: new Date(m.date * 1000),
          messageId: m.id,
        } as FileMetadata;
      })
      .filter(Boolean) as FileMetadata[];

    const sorted = sortFiles(files, params.sortBy, params.sortOrder);
    const nextCursor = messages.length > 0 ? messages[messages.length - 1].id : null;

    const response: PaginatedResponse<FileMetadata> = {
      data: sorted,
      pagination: {
        cursor: nextCursor,
        limit: params.limit,
        hasMore: nextCursor !== null,
      },
    };

    return Response.json({ success: true, ...response });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[files GET] Error:', err?.message ?? err);
    return Response.json({ success: false, error: err.message ?? 'Failed to list files' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireSession(request);
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const folderId = formData.get('folderId') as string | null;
    const uploadId = formData.get('uploadId') as string | null;

    if (!file) {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const client = await getClient(session.userId);

    let targetFolderId = folderId;
    if (!targetFolderId) {
      const folders = await listFolders(client);
      if (folders.length === 0) {
        const newFolder = await createFolder(client, 'Default');
        const folderMapping = await prisma.folderMapping.create({
          data: {
            userId: session.userId,
            folderName: 'Default',
            channelId: newFolder.channelId,
            accessHash: newFolder.accessHash,
            channelUsername: newFolder.channelUsername ?? null,
          },
        });
        targetFolderId = folderMapping.id;
      } else {
        const firstFolder = folders[0];
        const folderMapping = await prisma.folderMapping.findFirst({
          where: { userId: session.userId, channelId: firstFolder.channelId },
        });
        targetFolderId = folderMapping?.id ?? null;
      }
    }

    if (!targetFolderId) {
      return Response.json({ success: false, error: 'No folder available' }, { status: 400 });
    }

    const peer = await resolvePeer(client, session.userId, targetFolderId);

    const buffer = Buffer.from(await file.arrayBuffer());

    if (uploadId) {
      await initProgress(uploadId, file.name, file.size);
    }

    const onProgress = uploadId
      ? (progress: number) => updateProgress(uploadId, progress * file.size / 100, file.size)
      : undefined;

    const result = await uploadFile(client, peer, {
      name: file.name,
      buffer,
      mimeType: file.type || 'application/octet-stream',
    }, onProgress);

    if (uploadId) {
      await completeProgress(uploadId, true);
    }

    await trackUploadBytes(session.userId, file.size);

    return Response.json({ success: true, data: { messageId: result.id, fileName: file.name, fileSize: file.size } });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[files POST] Upload error:', err?.message ?? err, err?.stack);
    return Response.json({ success: false, error: err.message ?? 'Upload failed' }, { status: 500 });
  }
}
