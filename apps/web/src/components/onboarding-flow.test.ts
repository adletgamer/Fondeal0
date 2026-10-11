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
    expect(html).toContain('Verifying your account');
    expect(html).not.toContain('Continue as Business');
    expect(html).not.toContain('Continue as Investor');
  });

  it('shows both roles but requires a separate confirmation when the server is ready', () => {
    const html = renderToStaticMarkup(
      createElement(OnboardingFlow, { hasServerSession: true, hasServerWallet: true }),
    );
    expect(html).toContain('I am a Business');
    expect(html).toContain('I am an Investor');
    expect(html).toMatch(/disabled=""[^>]*>Choose a role to continue/);
  });

  it('shows a recoverable error when the verified login cannot reach the database', () => {
    const html = renderToStaticMarkup(
      createElement(OnboardingFlow, {
        hasServerSession: true,
        hasServerWallet: false,
        accountServiceUnavailable: true,
      }),
    );
    expect(html).toContain('Account setup is paused');
    expect(html).toContain('Try again');
    expect(html).not.toContain('Continue as Business');
  });
});
