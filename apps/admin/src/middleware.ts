import { NextResponse, type NextRequest } from 'next/server';
import { STAFF_COOKIE_NAME } from '@/lib/auth/session-cookie';
import { previewEnabled } from '@/lib/auth/staff';
import { buildCsp, securityHeaders } from '@/lib/csp';

/**
 * Two jobs: put the security headers (with a fresh CSP nonce) on every
 * response, and keep anyone without a session cookie out of every page but
 * /sign-in. The cookie check is only presence, because the Edge runtime cannot
 * verify it; each page and action calls `requireStaff()` for the real check.
 */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, process.env.NODE_ENV !== 'production');

  const open = request.nextUrl.pathname === '/sign-in' || previewEnabled();
  let response: NextResponse;
  if (!open && !request.cookies.has(STAFF_COOKIE_NAME)) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.search = '';
    response = NextResponse.redirect(url);
  } else {
    const headers = new Headers(request.headers);
    headers.set('x-nonce', nonce);
    headers.set('Content-Security-Policy', csp);
    response = NextResponse.next({ request: { headers } });
  }

  for (const [k, v] of Object.entries(securityHeaders(csp))) response.headers.set(k, v);
  return response;
}

export const config = {
  matcher: [{ source: '/((?!_next/static|_next/image|favicon.svg|robots.txt).*)' }],
};
