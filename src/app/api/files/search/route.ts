import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { searchQuerySchema } from '@/lib/security/validation';
import type { FileMetadata } from '@/types/file';

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request);
    const { searchParams } = new URL(request.url);
    const params = searchQuerySchema.parse(Object.fromEntries(searchParams));

    const client = await getClient(session.userId);

    let folderId = params.folderId;
    if (!folderId) {
      const { listFolders } = await import('@/lib/telegram/folders');
      const folders = await listFolders(client);
      if (folders.length === 0) {
        return Response.json({ success: true, data: [] });
      }
      const { prisma } = await import('@/lib/db/prisma');
      const folderMapping = await prisma.folderMapping.findFirst({
        where: { userId: session.userId, channelId: folders[0].channelId },
      });
      folderId = folderMapping?.id;
    }

    if (!folderId) {
      return Response.json({ success: true, data: [] });
    }

    const peer = await resolvePeer(client, session.userId, folderId);
    const messages = await client.getMessages(peer, {
      limit: 200,
      search: params.q,
    });

    const files: FileMetadata[] = messages
      .map((m: any) => {
        if (!m?.media) return null;
        const media = m.media as any;
        let name = 'Unknown';
        let size = 0;
        let mimeType = 'application/octet-stream';

        if (media.document) {
          size = parseInt(media.document.size?.toString() || '0');
          mimeType = media.document.mimeType || 'application/octet-stream';
          const attr = media.document.attributes?.find((a: any) => a.className === 'DocumentAttributeFilename');
          name = attr?.fileName ?? `file_${m.id}`;
        } else if (media.photo) {
          name = `photo_${m.id}.jpg`;
          mimeType = 'image/jpeg';
        } else {
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

    return Response.json({ success: true, data: files.slice(0, params.limit) });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Search failed' }, { status: 500 });
  }
}
