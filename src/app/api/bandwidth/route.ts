import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getBandwidthStats, getTodayBandwidth } from '@/lib/db/queries/bandwidth';

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request);
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') ?? '30');

    const stats = await getBandwidthStats(session.userId, days);
    const today = await getTodayBandwidth(session.userId);

    return Response.json({
      success: true,
      data: {
        today: {
          upBytes: today.upBytes,
          downBytes: today.downBytes,
          dailyLimitBytes: today.dailyLimitBytes,
        },
        history: stats,
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to get bandwidth stats' }, { status: 500 });
  }
}
