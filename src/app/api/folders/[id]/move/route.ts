import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { moveFile } from '@/lib/telegram/files';
import { moveFilesSchema } from '@/lib/security/validation';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    const { id: targetFolderId } = await params;
    const body = await request.json();
    const validated = moveFilesSchema.parse(body);

    const client = await getClient(session.userId);

    const targetFolder = await prisma.folderMapping.findFirst({
      where: { userId: session.userId, id: targetFolderId },
    });
    if (!targetFolder) {
      return Response.json({ success: false, error: 'Target folder not found' }, { status: 404 });
    }

    const targetPeer = await resolvePeer(client, session.userId, targetFolderId);

    const { searchParams } = new URL(request.url);
    const sourceFolderId = searchParams.get('sourceFolderId');
    if (!sourceFolderId) {
      return Response.json({ success: false, error: 'Missing sourceFolderId' }, { status: 400 });
    }

    const sourcePeer = await resolvePeer(client, session.userId, sourceFolderId);

    for (const messageId of validated.messageIds) {
      await moveFile(client, sourcePeer, targetPeer, messageId);
    }

    return Response.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to move files' }, { status: 500 });
  }
}
