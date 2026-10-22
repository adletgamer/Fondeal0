import { describe, expect, it } from 'vitest';
import { buildCsp, securityHeaders } from './csp';

describe('CSP', () => {
  const prod = buildCsp('abc123', false);

  it('allows scripts only with the nonce, and never eval, in production', () => {
    expect(prod).toContain(`script-src 'self' 'nonce-abc123' 'strict-dynamic'`);
    expect(prod).not.toContain('unsafe-eval');
    expect(prod).not.toMatch(/script-src[^;]*unsafe-inline/);
  });

  it('forbids framing, plugins, foreign origins and base-tag tricks', () => {
    for (const d of [
      `frame-ancestors 'none'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `connect-src 'self'`,
      `default-src 'self'`,
    ]) {
      expect(prod).toContain(d);
    }
    expect(prod).not.toMatch(/https?:\/\//);
  });

  it('allows eval only in development', () => {
    expect(buildCsp('n', true)).toContain(`'unsafe-eval'`);
  });
});

describe('security headers', () => {
  const h = securityHeaders('csp');
  it('keep the app unframed, uncached and out of search', () => {
    expect(h['X-Frame-Options']).toBe('DENY');
    expect(h['Cache-Control']).toBe('no-store');
    expect(h['X-Robots-Tag']).toContain('noindex');
    expect(h['Referrer-Policy']).toBe('no-referrer');
    expect(h['X-Content-Type-Options']).toBe('nosniff');
    expect(h['Content-Security-Policy']).toBe('csp');
  });
});
