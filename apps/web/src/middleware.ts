import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-cookie';

/**
 * First line of defense against route bypass: /business and /invest must
 * not be reachable — not even their login-prompt shell — by a request that
 * carries no session cookie at all. This only checks for the cookie's
 * *presence* (cheap, Edge-safe, no crypto or DB); the layouts underneath
 * (apps/web/src/app/business/layout.tsx, .../invest/layout.tsx) do the real
 * work of verifying the token's signature and checking the persisted role
 * via `getSession()`, which needs the Node.js runtime for Prisma.
 */
const PROTECTED_PREFIXES = ['/business', '/invest'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/business/:path*', '/invest/:path*'],
};
