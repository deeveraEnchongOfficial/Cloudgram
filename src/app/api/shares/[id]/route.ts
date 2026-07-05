import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { revokeShare } from '@/lib/db/queries/shares';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    const { id } = await params;

    await revokeShare(id, session.userId);
    return Response.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to revoke share' }, { status: 500 });
  }
}
