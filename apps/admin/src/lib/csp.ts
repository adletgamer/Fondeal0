/**
 * Content Security Policy for the back-office. Scripts run only with the
 * per-request nonce; nothing may frame the app; nothing is fetched from
 * another origin. Styles keep `'unsafe-inline'` because Next and Tailwind emit
 * inline style attributes; that is a known, accepted gap.
 */
export function buildCsp(nonce: string, dev: boolean): string {
  const script = [
    `'self'`,
    `'nonce-${nonce}'`,
    `'strict-dynamic'`,
    ...(dev ? [`'unsafe-eval'`] : []),
  ];
  return [
    `default-src 'self'`,
    `script-src ${script.join(' ')}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(dev ? [] : [`upgrade-insecure-requests`]),
  ].join('; ');
}

/** Headers set on every response, redirects included. */
export function securityHeaders(csp: string): Record<string, string> {
  return {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  };
}
