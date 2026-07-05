import { NextRequest } from 'next/server';
import { pollQrLogin } from '@/lib/telegram/auth';
import { getSessionString } from '@/lib/telegram/client';
import { createOrUpdateUser } from '@/lib/db/queries/users';
import { createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth/session';

function getAuthClient(sessionId: string): any {
  const globalMap = (globalThis as any).__authClients as Map<string, any> | undefined;
  return globalMap?.get(sessionId);
}

function getQrPromise(sessionId: string): Promise<any> | undefined {
  const globalMap = (globalThis as any).__qrPromises as Map<string, Promise<any>> | undefined;
  return globalMap?.get(sessionId);
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return Response.json({ success: false, error: 'Missing sessionId' }, { status: 400 });

    const client = getAuthClient(sessionId);
    if (!client) return Response.json({ success: false, error: 'Session expired' }, { status: 401 });

    const qrPromise = getQrPromise(sessionId);
    if (!qrPromise) return Response.json({ success: false, error: 'QR session not found' }, { status: 400 });

    const result = await pollQrLogin(qrPromise);

    if (result.pending) {
      return Response.json({ success: false, pending: true });
    }

    if (result.needsPassword) {
      return Response.json({ success: false, needsPassword: true });
    }

    if (!result.success || !result.user) {
      return Response.json({ success: false, pending: true });
    }

    const sessionString = getSessionString(client);
    const user = result.user;
    const telegramId = parseInt(user.id?.toString() ?? '0');

    const dbUser = await createOrUpdateUser({
      telegramId,
      firstName: user.firstName ?? user.first_name,
      lastName: user.lastName ?? user.last_name,
      username: user.username,
      apiId: client.apiId,
      apiHash: client.apiHash,
      sessionString,
    });

    const accessToken = createAccessToken({ userId: dbUser.id, telegramId });
    const refreshToken = createRefreshToken({ userId: dbUser.id, telegramId });
    const cookies = setAuthCookies(accessToken, refreshToken);

    const globalMap = (globalThis as any).__authClients as Map<string, any> | undefined;
    globalMap?.delete(sessionId);
    const qrMap = (globalThis as any).__qrPromises as Map<string, Promise<any>> | undefined;
    qrMap?.delete(sessionId);

    return Response.json({
      success: true,
      data: {
        userId: dbUser.id,
        telegramId,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        username: dbUser.username,
      },
    }, {
      headers: { 'Set-Cookie': cookies.join(', ') },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message ?? 'QR poll failed' },
      { status: 400 }
    );
  }
}
