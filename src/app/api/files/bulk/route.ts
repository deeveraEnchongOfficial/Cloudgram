import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { deleteFiles, moveFile } from '@/lib/telegram/files';
import { bulkOperationSchema } from '@/lib/security/validation';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = requireSession(request);
    const body = await request.json();
    const validated = bulkOperationSchema.parse(body);

    const client = await getClient(session.userId);
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return Response.json({ success: false, error: 'Missing folderId' }, { status: 400 });
    }

    const peer = await resolvePeer(client, session.userId, folderId);

    if (validated.operation === 'delete') {
      await deleteFiles(client, peer, validated.messageIds);
    } else if (validated.operation === 'move') {
      if (!validated.targetFolderId) {
        return Response.json({ success: false, error: 'Missing targetFolderId' }, { status: 400 });
      }
      const targetPeer = await resolvePeer(client, session.userId, validated.targetFolderId);
      for (const messageId of validated.messageIds) {
        await moveFile(client, peer, targetPeer, messageId);
      }
    }

    return Response.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Bulk operation failed' }, { status: 500 });
  }
}
