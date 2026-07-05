import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { getFileSize, getMimeType } from '@/lib/telegram/files';
import { createDownloadStream, parseRange } from '@/lib/telegram/streaming';

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const { prisma } = await import('@/lib/db/prisma');
    const bcrypt = await import('bcryptjs');
    const apiKey = authHeader.substring(7);
    const keys = await prisma.apiKey.findMany({ where: { revokedAt: null } });
    for (const key of keys) {
      if (await bcrypt.compare(apiKey, key.keyHash)) {
        await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
        return { userId: key.userId, telegramId: 0 };
      }
    }
    return null;
  }
  return getSession(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticate(request);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const messageId = parseInt(id);
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');
  if (!folderId) return Response.json({ error: 'Missing folderId' }, { status: 400 });

  const client = await getClient(session.userId);
  const peer = await resolvePeer(client, session.userId, folderId);
  const messages = await client.getMessages(peer, { ids: messageId });
  const message = messages[0];

  if (!message?.media) return Response.json({ error: 'Not found' }, { status: 404 });

  const fileSize = getFileSize(message.media);
  const mimeType = getMimeType(message.media);
  const range = request.headers.get('range');
  const { start, end } = parseRange(range, fileSize);

  const stream = await createDownloadStream(client, message, range ? start : undefined, range ? end - start + 1 : undefined);

  const headers = new Headers({
    'Content-Type': mimeType,
    'Accept-Ranges': 'bytes',
    'Content-Length': (end - start + 1).toString(),
  });

  if (range) {
    headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    return new Response(stream, { status: 206, headers });
  }

  return new Response(stream, { status: 200, headers });
}
