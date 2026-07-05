import { NextRequest } from 'next/server';
import { getSession, clearAuthCookies } from '@/lib/auth/session';
import { disconnectClient } from '@/lib/telegram/client';
import { clearUserSession } from '@/lib/db/queries/users';

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (session) {
    disconnectClient(session.userId);
    await clearUserSession(session.userId);
  }

  const cookies = clearAuthCookies();

  return Response.json(
    { success: true },
    { headers: { 'Set-Cookie': cookies.join(', ') } }
  );
}
