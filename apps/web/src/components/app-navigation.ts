export type AppRole = 'Business' | 'Investor';

export const APP_NAVIGATION = {
  Business: [
    { href: '/business', label: 'Dashboard' },
    { href: '/business/new', label: 'New request' },
    { href: '/business/passport', label: 'Passport' },
    { href: '/business/verify', label: 'Verification' },
  ],
  Investor: [
    { href: '/invest', label: 'Dashboard' },
    { href: '/invest/market', label: 'Market' },
    { href: '/invest/positions', label: 'Positions' },
  ],
} as const;

/** Detail pages inherit the nearest product destination in the single app nav. */
export function activeAppHref(role: AppRole, pathname: string): string | null {
  if (role === 'Business' && pathname.startsWith('/business/loans/')) return '/business';
  if (role === 'Investor' && pathname.startsWith('/invest/opportunity/')) return '/invest/market';
  const exact = APP_NAVIGATION[role].find(({ href }) => pathname === href);
  if (exact) return exact.href;
  // A section root is a prefix of every child. Match the most specific
  // destination first so /business/new does not light up Dashboard.
  const nested = [...APP_NAVIGATION[role]]
    .reverse()
    .find(({ href }) => pathname.startsWith(`${href}/`));
  return nested?.href ?? null;
}
