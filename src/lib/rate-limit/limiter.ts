import { mongoCache } from '@/lib/cache/mongo';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { RATE_LIMIT_DEFAULT, RATE_LIMIT_WINDOW_SEC } from '@/lib/constants';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(
  userId: string,
  action: string,
  limit: number = RATE_LIMIT_DEFAULT,
  windowSec: number = RATE_LIMIT_WINDOW_SEC
): Promise<RateLimitResult> {
  const key = CACHE_KEYS.rateLimit(userId, action);
  const expiresAt = new Date(Date.now() + windowSec * 1000);

  const result = await mongoCache.collection('cache_rate_limit').findOneAndUpdate(
    { _id: key as any },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt },
    },
    { upsert: true, returnDocument: 'after' }
  );

  const count = result?.count ?? 1;
  const remaining = Math.max(0, limit - count);
  const resetAt = Date.now() + windowSec * 1000;

  return {
    allowed: count <= limit,
    remaining,
    resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_DEFAULT),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
  };
}
