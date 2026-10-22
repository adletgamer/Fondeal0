import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string | null;
    role: 'Business' | 'Investor' | null;
  },
}));

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock('@/lib/auth/session', () => ({ getSession: async () => state.session }));

const { default: OnboardingPage } = await import('./page');

beforeEach(() => {
  state.session = null;
});

describe('onboarding server routing', () => {
  it.each([
    ['Business', '/business'],
    ['Investor', '/invest'],
  ] as const)('routes an existing %s user to %s', async (role, destination) => {
    state.session = { privyUserId: 'existing', stellarAddress: 'GSTELLAR', role };
    await expect(OnboardingPage()).rejects.toThrow(`REDIRECT:${destination}`);
  });

  it('only marks a new user ready when the verified session includes a wallet', async () => {
    state.session = { privyUserId: 'new', stellarAddress: null, role: null };
    const withoutWallet = (await OnboardingPage()) as ReactElement<{ children: ReactElement[] }>;
    expect(withoutWallet.props.children[1]?.props).toMatchObject({
      hasServerSession: true,
      hasServerWallet: false,
    });

    state.session.stellarAddress = 'GSTELLAR';
    const withWallet = (await OnboardingPage()) as ReactElement<{ children: ReactElement[] }>;
    expect(withWallet.props.children[1]?.props).toMatchObject({
      hasServerSession: true,
      hasServerWallet: true,
    });
  });
});
