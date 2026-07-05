import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { deleteFiles, getFileSize, getMimeType } from '@/lib/telegram/files';
import { trackDownloadBytes } from '@/lib/db/queries/bandwidth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    const { id } = await params;
    const messageId = parseInt(id);

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    if (!folderId) {
      return Response.json({ success: false, error: 'Missing folderId' }, { status: 400 });
    }

    const client = await getClient(session.userId);
    const peer = await resolvePeer(client, session.userId, folderId);

    const messages = await client.getMessages(peer, { ids: messageId });
    const message = messages[0];

    if (!message?.media) {
      return Response.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const fileSize = getFileSize(message.media);
    const mimeType = getMimeType(message.media);

    let fileName = `file_${messageId}`;
    const media = message.media as any;
    if (media.document) {
      const doc = media.document;
      const fileNameAttr = doc.attributes?.find((a: any) => a.className === 'DocumentAttributeFilename');
      if (fileNameAttr?.fileName) fileName = fileNameAttr.fileName;
    } else if (media.photo) {
      fileName = `photo_${messageId}.jpg`;
    }

    const buffer = await client.downloadMedia(message);
    if (!buffer) {
      return Response.json({ success: false, error: 'Download failed' }, { status: 500 });
    }

    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as unknown as ArrayBuffer);

    await trackDownloadBytes(session.userId, fileSize);

    return new Response(buf as any, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(buf.length),
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Download failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    const { id } = await params;
    const messageId = parseInt(id);

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    if (!folderId) {
      return Response.json({ success: false, error: 'Missing folderId' }, { status: 400 });
    }

    const client = await getClient(session.userId);
    const peer = await resolvePeer(client, session.userId, folderId);

    await deleteFiles(client, peer, [messageId]);

    return Response.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Delete failed' }, { status: 500 });
  }
}
