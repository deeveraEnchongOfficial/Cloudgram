import { NextRequest } from 'next/server';
import { startQrLogin } from '@/lib/telegram/auth';

function getAuthClient(sessionId: string): any {
  const globalMap = (globalThis as any).__authClients as Map<string, any> | undefined;
  return globalMap?.get(sessionId);
}

function setQrPromise(sessionId: string, promise: Promise<any>) {
  const globalMap = (globalThis as any).__qrPromises as Map<string, Promise<any>> | undefined;
  if (!globalMap) {
    (globalThis as any).__qrPromises = new Map<string, Promise<any>>();
  }
  (globalThis as any).__qrPromises.set(sessionId, promise);
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return Response.json({ success: false, error: 'Missing sessionId' }, { status: 400 });

    const client = getAuthClient(sessionId);
    if (!client) return Response.json({ success: false, error: 'Session expired' }, { status: 401 });

    const result = await startQrLogin(client);
    setQrPromise(sessionId, result.qrPromise);

    return Response.json({ success: true, data: { token: result.token.toString('base64') } });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message ?? 'QR login failed' },
      { status: 400 }
    );
  }
}
