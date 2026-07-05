import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { generateApiKey, getKeyPrefix } from '@/lib/security/crypto';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.userId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({
    keys: keys.map(k => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = body.name ?? 'Default';

  const apiKey = generateApiKey();
  const keyHash = await bcrypt.hash(apiKey, 10);
  const keyPrefix = getKeyPrefix(apiKey);

  await prisma.apiKey.create({
    data: {
      userId: session.userId,
      keyHash,
      keyPrefix,
      name,
    },
  });

  return Response.json({ apiKey, keyPrefix, name });
}
