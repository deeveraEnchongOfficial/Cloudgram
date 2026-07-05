import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { listFiles } from '@/lib/telegram/files';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    const { id } = await params;

    const folder = await prisma.folderMapping.findFirst({
      where: { userId: session.userId, id },
    });

    if (!folder) {
      return Response.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    const client = await getClient(session.userId);
    const peer = await resolvePeer(client, session.userId, id);
    const files = await listFiles(client, peer, 100);

    return Response.json({ success: true, data: files });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to list folder contents' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    const { id } = await params;

    const folder = await prisma.folderMapping.findFirst({
      where: { userId: session.userId, id },
    });

    if (!folder) {
      return Response.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    await prisma.folderMapping.delete({ where: { id: folder.id } });

    return Response.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to delete folder' }, { status: 500 });
  }
}
