import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/queries/users';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ success: false, authenticated: false }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return Response.json({ success: false, authenticated: false }, { status: 401 });
  }

  return Response.json({
    success: true,
    authenticated: true,
    data: {
      userId: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    },
  });
}
