export type AppRole = 'Business' | 'Investor';

export const APP_NAVIGATION = {
  Business: [
    { href: '/business', label: 'Inicio' },
    { href: '/business/new', label: 'Nueva solicitud' },
    { href: '/business/passport', label: 'Pasaporte' },
    { href: '/business/verify', label: 'Verificación' },
    { href: '/business/datos', label: 'Mis datos' },
  ],
  Investor: [
    { href: '/invest', label: 'Inicio' },
    { href: '/invest/market', label: 'Mercado' },
    { href: '/invest/positions', label: 'Posiciones' },
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
