import { NextRequest } from 'next/server';
import { phoneSchema } from '@/lib/security/validation';
import { requestCode } from '@/lib/telegram/auth';

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
    const validated = phoneSchema.parse(body);

    const { phoneCodeHash } = await requestCode(client, validated.phoneNumber);

    return Response.json({ success: true, data: { phoneCodeHash } });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message ?? 'Failed to send code' },
      { status: 400 }
    );
  }
}
