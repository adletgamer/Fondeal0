import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string;
    role: 'Business' | 'Investor';
  },
  find: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock('@/lib/auth/session', () => ({ getSession: async () => state.session }));
vi.mock('@/lib/app-locale', () => ({ getAppTranslator: async () => (message: string) => message }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@fondealo/database', () => ({ prisma: { $transaction: state.transaction } }));
const { saveBusinessProfile } = await import('./business-profile');
const valid = {
  legalName: 'Empresa de prueba SAC',
  country: 'Peru',
  sector: 'Technology',
  foundedYear: 2020,
  revenueBand: 'Under $5k / month',
  profile: {
    primaryCashFlowType: 'B2B_RECEIVABLES',
    financingUseCase: 'INVOICE_ADVANCE',
    requestedAmountBand: 'UP_TO_10K',
    preferredTermBand: 'DAYS_31_TO_90',
    b2bShareBand: null,
  },
};
beforeEach(() => {
  vi.clearAllMocks();
  state.session = { privyUserId: 'verified-user', stellarAddress: 'GOWNER', role: 'Business' };
  state.find.mockResolvedValue(null);
  state.create.mockResolvedValue({ id: 'own-business' });
  state.update.mockResolvedValue({ id: 'own-business' });
  state.upsert.mockResolvedValue({});
  state.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      business: { findUnique: state.find, create: state.create, update: state.update },
      businessFinancingProfile: { upsert: state.upsert },
      businessProfileEvent: { create: vi.fn() },
    }),
  );
});
describe('business economic profile boundary', () => {
  it.each([null, { privyUserId: 'investor', stellarAddress: 'GOTHER', role: 'Investor' } as const])(
    'denies anonymous and Investor callers before database access',
    async (session) => {
      state.session = session;
      expect((await saveBusinessProfile(valid)).ok).toBe(false);
      expect(state.transaction).not.toHaveBeenCalled();
    },
  );
  it('rejects client-supplied identity and approval fields', async () => {
    expect((await saveBusinessProfile({ ...valid, stellarAddress: 'GVICTIM' })).ok).toBe(false);
    expect(
      (await saveBusinessProfile({ ...valid, profile: { ...valid.profile, approved: true } })).ok,
    ).toBe(false);
    expect(state.transaction).not.toHaveBeenCalled();
  });
  it('creates only the session-owned company and a self-reported profile', async () => {
    expect(await saveBusinessProfile(valid)).toEqual({ ok: true });
    expect(state.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ stellarAddress: 'GOWNER' }) }),
    );
    expect(state.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: 'own-business' },
        create: expect.objectContaining({
          profileVersion: 'business-financing-v1',
          completedAt: expect.any(Date),
        }),
      }),
    );
  });
  it('preserves identity already included in verification', async () => {
    state.find.mockResolvedValue({
      id: 'own-business',
      legalName: 'Reviewed identity',
      country: 'Peru',
      sector: 'Technology',
      foundedYear: 2020,
      revenueBand: valid.revenueBand,
      _count: { kybSubmissions: 1 },
    });
    expect((await saveBusinessProfile(valid)).ok).toBe(false);
    expect(state.update).not.toHaveBeenCalled();
    expect(state.upsert).not.toHaveBeenCalled();
  });
  it('does not save debt terms for pre-revenue companies or infer approval', async () => {
    expect(
      (
        await saveBusinessProfile({
          ...valid,
          revenueBand: null,
          profile: { ...valid.profile, primaryCashFlowType: 'PRE_REVENUE' },
        })
      ).ok,
    ).toBe(false);
    expect(
      await saveBusinessProfile({
        ...valid,
        revenueBand: null,
        profile: {
          ...valid.profile,
          primaryCashFlowType: 'PRE_REVENUE',
          financingUseCase: null,
          requestedAmountBand: null,
          preferredTermBand: null,
        },
      }),
    ).toEqual({ ok: true });
  });
  it('returns a recoverable failure when persistence is unavailable', async () => {
    state.transaction.mockRejectedValueOnce(new Error('database down'));
    expect((await saveBusinessProfile(valid)).ok).toBe(false);
  });
});
