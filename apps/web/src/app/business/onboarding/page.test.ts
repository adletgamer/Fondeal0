import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string;
    role: 'Business' | 'Investor';
  },
  profile: vi.fn(),
}));
vi.mock('@/lib/auth/session', () => ({ getSession: async () => state.session }));
vi.mock('@/lib/app-locale', () => ({ getAppLocale: async () => 'es' }));
vi.mock('@/lib/data/business-onboarding', () => ({ getBusinessOnboardingState: state.profile }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
const { default: Page } = await import('./page');
beforeEach(() => {
  vi.clearAllMocks();
  state.session = null;
});
describe('financial onboarding route authorization', () => {
  it('denies anonymous and Investor sessions before loading any business profile', async () => {
    await expect(Page()).rejects.toThrow('REDIRECT:/onboarding');
    state.session = { privyUserId: 'investor', stellarAddress: 'GINVESTOR', role: 'Investor' };
    await expect(Page()).rejects.toThrow('REDIRECT:/invest');
    expect(state.profile).not.toHaveBeenCalled();
  });
  it('uses only the verified Business session to start a new profile', async () => {
    state.session = { privyUserId: 'owner', stellarAddress: 'GOWNER', role: 'Business' };
    state.profile.mockResolvedValue({ kind: 'NO_BUSINESS', initial: null });
    await expect(Page()).resolves.toBeTruthy();
    expect(state.profile).toHaveBeenCalledWith(state.session);
  });
  it('renders a recoverable notice if the profile is unavailable', async () => {
    state.session = { privyUserId: 'owner', stellarAddress: 'GOWNER', role: 'Business' };
    state.profile.mockResolvedValue({ kind: 'UNAVAILABLE', initial: null });
    await expect(Page()).resolves.toBeTruthy();
  });
});
