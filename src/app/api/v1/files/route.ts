import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { listFiles } from '@/lib/telegram/files';
import { prisma } from '@/lib/db/prisma';

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7);
    const bcrypt = await import('bcryptjs');
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

export async function GET(request: NextRequest) {
  const session = await authenticate(request);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const cursor = searchParams.get('cursor') ? parseInt(searchParams.get('cursor')!) : undefined;

  if (!folderId) return Response.json({ error: 'Missing folderId' }, { status: 400 });

  const client = await getClient(session.userId);
  const peer = await resolvePeer(client, session.userId, folderId);
  const files = await listFiles(client, peer, limit, cursor);

  return Response.json({ files });
}
