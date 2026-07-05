import { NextRequest } from 'next/server';
import { passwordSchema } from '@/lib/security/validation';
import { checkPassword } from '@/lib/telegram/auth';
import { getSessionString } from '@/lib/telegram/client';
import { createOrUpdateUser } from '@/lib/db/queries/users';
import { createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth/session';

function getAuthClient(sessionId: string): any {
  const globalMap = (globalThis as any).__authClients as Map<string, any> | undefined;
  return globalMap?.get(sessionId);
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return Response.json({ success: false, error: 'Missing sessionId' }, { status: 400 });

    const client = getAuthClient(sessionId);
    if (!client) return Response.json({ success: false, error: 'Session expired' }, { status: 401 });

    const body = await request.json();
    const validated = passwordSchema.parse(body);

    const result = await checkPassword(client, validated.password);

    if (!result.success || !result.user) {
      return Response.json({ success: false, error: 'Password verification failed' }, { status: 400 });
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
      { success: false, error: err.message ?? 'Password verification failed' },
      { status: 400 }
    );
  }
}
