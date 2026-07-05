import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { listFolders, createFolder } from '@/lib/telegram/folders';
import { prisma } from '@/lib/db/prisma';
import { createFolderSchema } from '@/lib/security/validation';

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request);
    const client = await getClient(session.userId);

    const dbFolders = await prisma.folderMapping.findMany({
      where: { userId: session.userId },
      orderBy: { folderName: 'asc' },
    });

    if (dbFolders.length === 0) {
      const tgFolders = await listFolders(client);
      for (const folder of tgFolders) {
        const existing = await prisma.folderMapping.findFirst({
          where: { userId: session.userId, channelId: folder.channelId },
        });
        if (!existing) {
          await prisma.folderMapping.create({
            data: {
              userId: session.userId,
              folderName: folder.name,
              channelId: folder.channelId,
              accessHash: folder.accessHash,
              channelUsername: folder.channelUsername ?? null,
            },
          });
        }
      }
      return Response.json({
        success: true,
        data: await prisma.folderMapping.findMany({
          where: { userId: session.userId },
          orderBy: { folderName: 'asc' },
        }),
      });
    }

    return Response.json({ success: true, data: dbFolders });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[folders GET] Error:', err?.message ?? err);
    return Response.json({ success: false, error: err.message ?? 'Failed to list folders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireSession(request);
    const body = await request.json();
    const validated = createFolderSchema.parse(body);

    const client = await getClient(session.userId);
    const folder = await createFolder(client, validated.folderName);

    const folderMapping = await prisma.folderMapping.create({
      data: {
        userId: session.userId,
        folderName: validated.folderName,
        channelId: folder.channelId,
        accessHash: folder.accessHash,
        channelUsername: folder.channelUsername ?? null,
      },
    });

    return Response.json({ success: true, data: folderMapping });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to create folder' }, { status: 500 });
  }
}
