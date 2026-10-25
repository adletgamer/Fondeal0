import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock('@fondealo/database', () => ({ prisma: { business: { findUnique: state.find } } }));
const { getBusinessOnboardingState } = await import('./business-onboarding');
const session = { privyUserId: 'owner', stellarAddress: 'GOWNER', role: 'Business' as const };
const business = {
  legalName: 'Company',
  country: 'Peru',
  sector: 'Technology',
  foundedYear: 2020,
  revenueBand: 'Under $5k / month',
  _count: { kybSubmissions: 0 },
  financingProfile: null,
};
beforeEach(() => {
  vi.clearAllMocks();
});
describe('onboarding state is server-derived', () => {
  it('never reads another role’s company', async () => {
    expect((await getBusinessOnboardingState({ ...session, role: 'Investor' })).kind).toBe(
      'UNAVAILABLE',
    );
    expect(state.find).not.toHaveBeenCalled();
  });
  it('distinguishes no business, an existing incomplete profile and database failure', async () => {
    state.find
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(business)
      .mockRejectedValueOnce(new Error('offline'));
    expect((await getBusinessOnboardingState(session)).kind).toBe('NO_BUSINESS');
    expect((await getBusinessOnboardingState(session)).kind).toBe('PROFILE_INCOMPLETE');
    expect((await getBusinessOnboardingState(session)).kind).toBe('UNAVAILABLE');
  });
  it('reports a completed pre-revenue profile without calling it eligible', async () => {
    state.find.mockResolvedValue({
      ...business,
      financingProfile: {
        primaryCashFlowType: 'PRE_REVENUE',
        financingUseCase: null,
        requestedAmountBand: null,
        preferredTermBand: null,
        b2bShareBand: null,
        completedAt: new Date(),
        profileVersion: 'business-financing-v1',
      },
    });
    expect((await getBusinessOnboardingState(session)).kind).toBe('PRE_REVENUE');
    expect(state.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stellarAddress: 'GOWNER' } }),
    );
  });
});
