import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';

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
      return Response.json({ success: false, error: 'No media' }, { status: 404 });
    }

    const thumbBuffer = await client.downloadMedia(message, { thumb: 0 } as any);
    if (!thumbBuffer) {
      return Response.json({ success: false, error: 'No thumbnail' }, { status: 404 });
    }

    const buf = Buffer.isBuffer(thumbBuffer) ? thumbBuffer : Buffer.from(thumbBuffer as unknown as ArrayBuffer);

    return new Response(buf as any, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Preview failed' }, { status: 500 });
  }
}
