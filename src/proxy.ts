import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/session';
import { COOKIE_NAMES } from '@/lib/auth/constants';

const protectedPaths = ['/dashboard', '/folder', '/settings', '/shares'];
const protectedApiPaths = ['/api/files', '/api/folders', '/api/shares', '/api/settings', '/api/stream', '/api/v1'];
const publicApiPaths = ['/api/auth', '/api/health', '/api/shares/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = protectedPaths.some(p => pathname.startsWith(p));
  const isProtectedApi = protectedApiPaths.some(p => pathname.startsWith(p)) &&
    !publicApiPaths.some(p => pathname.startsWith(p));

  if (isProtectedPage || isProtectedApi) {
    const token = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

    if (!token || !verifyAccessToken(token)) {
      if (isProtectedApi) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/folder/:path*',
    '/settings/:path*',
    '/shares/:path*',
    '/api/files/:path*',
    '/api/folders/:path*',
    '/api/shares/:path*',
    '/api/settings/:path*',
    '/api/stream/:path*',
    '/api/v1/:path*',
  ],
};
