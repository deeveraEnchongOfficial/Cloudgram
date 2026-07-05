import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createShare, listSharesByUser } from '@/lib/db/queries/shares';
import { createShareSchema } from '@/lib/security/validation';

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request);
    const shares = await listSharesByUser(session.userId);

    const publicUrl = process.env.PUBLIC_URL ?? '';
    const data = shares.map(s => ({
      id: s.id,
      token: s.token,
      fileName: s.fileName,
      fileSize: s.fileSize,
      mimeType: s.mimeType,
      expiresAt: s.expiresAt,
      downloadCount: s.downloadCount,
      createdAt: s.createdAt,
      link: `${publicUrl}/shares/${s.token}`,
    }));

    return Response.json({ success: true, data });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to list shares' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireSession(request);
    const body = await request.json();
    const validated = createShareSchema.parse(body);

    const share = await createShare({
      userId: session.userId,
      folderMappingId: validated.folderId,
      messageId: validated.messageId,
      fileName: validated.fileName,
      fileSize: validated.fileSize,
      password: validated.password,
      expiryHours: validated.expiryHours,
    });

    const publicUrl = process.env.PUBLIC_URL ?? '';
    return Response.json({
      success: true,
      data: {
        id: share.id,
        token: share.token,
        link: `${publicUrl}/shares/${share.token}`,
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to create share' }, { status: 500 });
  }
}
