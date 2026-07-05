import { NextRequest } from 'next/server';
import { apiCredentialsSchema } from '@/lib/security/validation';
import { createTempClient } from '@/lib/telegram/client';
import { mongoCache } from '@/lib/cache/mongo';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { CACHE_TTL } from '@/lib/constants';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = apiCredentialsSchema.parse(body);

    const sessionId = crypto.randomUUID();
    const client = await createTempClient(validated.apiId, validated.apiHash);

    await mongoCache.set('cache_auth_state', CACHE_KEYS.authState(sessionId), {
      apiId: validated.apiId,
      apiHash: validated.apiHash,
      clientConnected: true,
    }, CACHE_TTL.AUTH_STATE);

    if (!(globalThis as any).__authClients) {
      (globalThis as any).__authClients = new Map();
    }
    (globalThis as any).__authClients.set(sessionId, client);

    return Response.json({ success: true, data: { sessionId } });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message ?? 'Connection failed' },
      { status: 400 }
    );
  }
}
