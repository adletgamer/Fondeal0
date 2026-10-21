import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  wallet: {
    ready: true,
    authenticated: true,
    stellarAddress: 'GSTELLAR',
    creatingWallet: false,
    walletError: null,
    login: vi.fn(),
    logout: vi.fn(),
  },
  refresh: vi.fn(),
}));

vi.mock('@/hooks/use-stellar-wallet', () => ({ useStellarWallet: () => state.wallet }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: state.refresh }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/actions/onboarding', () => ({ chooseRole: vi.fn() }));

vi.stubEnv('NEXT_PUBLIC_PRIVY_APP_ID', 'test-app');
const { OnboardingFlow } = await import('./onboarding-flow');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('onboarding role choice', () => {
  it.each([
    [false, false],
    [true, false],
  ])('does not expose a role action without verified server state (%s, %s)', (session, wallet) => {
    const html = renderToStaticMarkup(
      createElement(OnboardingFlow, { hasServerSession: session, hasServerWallet: wallet }),
    );
    expect(html).toContain('Confirmando tu cuenta');
    expect(html).not.toContain('Continuar como');
  });

  it('offers only the business role and requires a separate confirmation', () => {
    const html = renderToStaticMarkup(
      createElement(OnboardingFlow, { hasServerSession: true, hasServerWallet: true }),
    );
    expect(html).toContain('Soy una empresa');
    expect(html).not.toContain('inversionista');
    expect(html).toMatch(/disabled=""[^>]*>Elige una opción para continuar/);
  });

  it('never promises returns or vetted borrowers', () => {
    const html = renderToStaticMarkup(
      createElement(OnboardingFlow, { hasServerSession: true, hasServerWallet: true }),
    ).toLowerCase();
    for (const phrase of ['earn', 'returns', 'vetted', 'retorno', 'rentabilidad', 'gana']) {
      expect(html).not.toContain(phrase);
    }
  });

  it('shows a recoverable error when the verified login cannot reach the database', () => {
    const html = renderToStaticMarkup(
      createElement(OnboardingFlow, {
        hasServerSession: true,
        hasServerWallet: false,
        accountServiceUnavailable: true,
      }),
    );
    expect(html).toContain('No pudimos terminar de crear tu cuenta');
    expect(html).toContain('Intentar de nuevo');
    expect(html).not.toContain('Continuar como');
  });
});
