import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STAFF_COOKIE_NAME } from '@/lib/auth/session-cookie';
import { middleware } from './middleware';

afterEach(() => vi.unstubAllEnvs());

const req = (path: string, cookie?: string) =>
  new NextRequest(`https://admin.example${path}`, {
    headers: cookie ? { cookie: `${STAFF_COOKIE_NAME}=${cookie}` } : {},
  });

describe('middleware', () => {
  it('sends a visitor without a session cookie to /sign-in', () => {
    vi.stubEnv('ADMIN_PREVIEW_FIXTURES', '');
    const res = middleware(req('/cases/anything'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/sign-in');
  });

  it('lets /sign-in render for anyone', () => {
    const res = middleware(req('/sign-in'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('lets a request with the cookie through (the page still verifies it)', () => {
    const res = middleware(req('/', 'x'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('puts the security headers on every response, redirects included', () => {
    vi.stubEnv('ADMIN_PREVIEW_FIXTURES', '');
    for (const res of [middleware(req('/')), middleware(req('/sign-in'))]) {
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('Content-Security-Policy')).toContain('nonce-');
      expect(res.headers.get('Cache-Control')).toBe('no-store');
    }
  });

  it('uses a fresh nonce on each request', () => {
    const a = middleware(req('/sign-in')).headers.get('Content-Security-Policy');
    const b = middleware(req('/sign-in')).headers.get('Content-Security-Policy');
    expect(a).not.toBe(b);
  });
});
