import jwt from 'jsonwebtoken';
import { parseCookie, stringifySetCookie } from 'cookie';
import { COOKIE_NAMES, JWT_SECRETS } from '@/lib/auth/constants';
import { JWT_ACCESS_TTL, JWT_REFRESH_TTL } from '@/lib/constants';
import type { AuthSession } from '@/types/api';

export interface TokenPayload {
  userId: string;
  telegramId: number;
  iat?: number;
  exp?: number;
}

export function createAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  if (!JWT_SECRETS.access) throw new Error('JWT_SECRET is required');
  return jwt.sign(payload, JWT_SECRETS.access, { expiresIn: JWT_ACCESS_TTL });
}

export function createRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  if (!JWT_SECRETS.refresh) throw new Error('JWT_REFRESH_SECRET is required');
  return jwt.sign(payload, JWT_SECRETS.refresh, { expiresIn: JWT_REFRESH_TTL });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    if (!JWT_SECRETS.access) return null;
    return jwt.verify(token, JWT_SECRETS.access) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    if (!JWT_SECRETS.refresh) return null;
    return jwt.verify(token, JWT_SECRETS.refresh) as TokenPayload;
  } catch {
    return null;
  }
}

export function parseCookies(request: Request): Record<string, string | undefined> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return {};
  return parseCookie(cookieHeader);
}

export function getTokenFromCookies(request: Request): string | null {
  const cookies = parseCookies(request);
  return cookies[COOKIE_NAMES.ACCESS_TOKEN] ?? null;
}

export function setAuthCookies(accessToken: string, refreshToken: string): string[] {
  const isSecure = process.env.NODE_ENV === 'production';
  const baseOpts = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict' as const,
    path: '/',
  };

  return [
    stringifySetCookie({
      name: COOKIE_NAMES.ACCESS_TOKEN,
      value: accessToken,
      maxAge: JWT_ACCESS_TTL,
      ...baseOpts,
    }),
    stringifySetCookie({
      name: COOKIE_NAMES.REFRESH_TOKEN,
      value: refreshToken,
      maxAge: JWT_REFRESH_TTL,
      ...baseOpts,
    }),
  ];
}

export function clearAuthCookies(): string[] {
  const isSecure = process.env.NODE_ENV === 'production';
  const baseOpts = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  };

  return [
    stringifySetCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, value: '', ...baseOpts }),
    stringifySetCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, value: '', ...baseOpts }),
  ];
}

export async function getSession(request: Request): Promise<AuthSession | null> {
  const token = getTokenFromCookies(request);
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload) return null;
  return {
    userId: payload.userId,
    telegramId: payload.telegramId,
  };
}

export function requireSession(request: Request): AuthSession {
  const token = getTokenFromCookies(request);
  if (!token) {
    throw new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return { userId: payload.userId, telegramId: payload.telegramId };
}
