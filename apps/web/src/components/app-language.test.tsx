import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({
  usePathname: () => '/business',
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@privy-io/react-auth', () => ({ usePrivy: () => ({ logout: vi.fn() }) }));
vi.mock('@/lib/actions/app-locale', () => ({ setAppLocale: vi.fn() }));
vi.mock('@/lib/actions/session', () => ({ clearSession: vi.fn() }));
vi.mock('next/image', () => ({
  default: ({ priority: _priority, ...props }: Record<string, unknown>) =>
    createElement('img', props),
}));
const { AppShell } = await import('./app-shell');
const { AppLocaleProvider } = await import('./app-locale-provider');
const { BalanceCard } = await import('./balance-card');
const { MarketGrid } = await import('./market-grid');

describe('functional ES/EN dashboard rendering', () => {
  it.each(['Business', 'Investor'] as const)(
    'shows a language selector and translates the complete %s navigation',
    (role) => {
      const es = renderToStaticMarkup(
        <AppShell role={role} address="GTEST" locale="es">
          Test
        </AppShell>,
      );
      const en = renderToStaticMarkup(
        <AppShell role={role} address="GTEST" locale="en">
          Test
        </AppShell>,
      );
      expect(es).toContain('Cambiar idioma');
      expect(en).toContain('Change language');
      expect(es).toContain('Español');
      expect(en).toContain('English');
      expect(es).toContain('Inicio');
      expect(en).toContain('Home');
      expect(es).toContain(role === 'Business' ? 'Perfil financiero' : 'Posiciones');
      expect(en).toContain(role === 'Business' ? 'Financial profile' : 'Positions');
      expect(en).not.toContain(
        role === 'Business' ? 'href="/invest/market"' : 'href="/business/new"',
      );
    },
  );
  it('translates balance and market controls, not just the header', () => {
    for (const locale of ['es', 'en'] as const) {
      const html = renderToStaticMarkup(
        <AppLocaleProvider locale={locale}>
          <BalanceCard summary={{ balanceUsdc: 1234.5, recent: [] }} />
          <MarketGrid opportunities={[]} />
        </AppLocaleProvider>,
      );
      expect(html).toContain(locale === 'es' ? 'Saldo disponible' : 'Available balance');
      expect(html).toContain(locale === 'es' ? 'Sin resultados' : 'No matches');
      expect(html).toContain(locale === 'es' ? 'Fondos de prueba' : 'Test funds');
      expect(html).not.toContain(locale === 'es' ? '>Filters<' : '>Filtros<');
    }
  });
});
