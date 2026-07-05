import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { getFileSize, getMimeType } from '@/lib/telegram/files';
import { createDownloadStream, parseRange } from '@/lib/telegram/streaming';
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

    const range = request.headers.get('range');

    if (fileSize > 0) {
      const { start, end } = parseRange(range, fileSize);

      const stream = await createDownloadStream(
        client,
        message,
        range ? start : undefined,
        range ? end - start + 1 : undefined
      );

      await trackDownloadBytes(session.userId, end - start + 1);

      const headers = new Headers({
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Content-Length': (end - start + 1).toString(),
        'Cache-Control': 'private, max-age=3600',
      });

      if (range) {
        headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        return new Response(stream, { status: 206, headers });
      }

      return new Response(stream, { status: 200, headers });
    }

    // For photos and media with unknown size, download as buffer
    const buffer = await client.downloadMedia(message);
    if (!buffer) {
      return Response.json({ success: false, error: 'Download failed' }, { status: 500 });
    }

    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as unknown as ArrayBuffer);
    await trackDownloadBytes(session.userId, buf.length);

    return new Response(buf as any, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Download failed' }, { status: 500 });
  }
}
