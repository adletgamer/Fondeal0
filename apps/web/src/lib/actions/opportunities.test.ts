import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string | null;
    role: 'Business' | 'Investor' | null;
  },
  businessFind: vi.fn(),
  opportunityFind: vi.fn(),
  opportunityCreate: vi.fn(),
  opportunityUpdate: vi.fn(),
  fundingCreate: vi.fn(),
  repaymentFind: vi.fn(),
  repaymentCreate: vi.fn(),
  fundingFind: vi.fn(),
  debit: vi.fn(),
  credit: vi.fn(),
  revalidate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: async () => state.session,
  describeError: (error: unknown) => String(error),
}));
vi.mock('next/cache', () => ({ revalidatePath: state.revalidate }));
vi.mock('@/lib/wallet/ledger', () => ({
  InsufficientFundsError: class InsufficientFundsError extends Error {},
  debit: state.debit,
  credit: state.credit,
  usdcToStroops: (value: number) => BigInt(Math.round(value * 10_000_000)),
  withSerializableRetry: (fn: (tx: unknown) => Promise<unknown>) => state.transaction(fn),
}));

const { createOpportunity, fundOpportunity, repayOpportunity } = await import('./opportunities');

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const fundingForm = (amount: string) => form({ opportunityId: 'loan-1', amount });
const creationForm = () =>
  form({ title: 'Working capital', amount: '100', termDays: '90', aprBps: '1800' });

beforeEach(() => {
  vi.clearAllMocks();
  state.session = { privyUserId: 'investor', stellarAddress: 'GINVESTOR', role: 'Investor' };
  state.opportunityFind.mockResolvedValue({
    id: 'loan-1',
    title: 'Working capital',
    amount: '100',
    funded: '0',
    aprBps: 1800,
    termDays: 90,
    status: 'Open',
    riskBand: 'C',
    business: { stellarAddress: 'GBUSINESS' },
  });
  state.businessFind.mockResolvedValue({
    id: 'business-1',
    kybSubmissions: [
      {
        id: 'kyb-1',
        status: 'Accepted',
        provider: 'registry',
        reviewedAt: new Date('2026-10-10T00:00:00Z'),
        dataHash: '0xabc',
      },
    ],
    underwritingDecisions: [
      {
        status: 'Approved',
        kybSubmissionId: 'kyb-1',
        policyVersion: 'v1',
        evidenceRefs: ['registry-1'],
        decidedBy: 'reviewer-1',
        maxPrincipalStroops: 2_000_000_000n,
        maxTermDays: 180,
        expiresAt: new Date('2099-01-01T00:00:00Z'),
      },
    ],
    passport: { riskBand: 'C', kybStatus: 'Accepted', dataHash: '0xabc' },
  });
  state.repaymentFind.mockResolvedValue([]);
  state.fundingFind.mockResolvedValue([{ investor: 'GINVESTOR', amount: '100' }]);
  state.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      business: { findUnique: state.businessFind },
      opportunity: {
        findUnique: state.opportunityFind,
        create: state.opportunityCreate,
        update: state.opportunityUpdate,
      },
      funding: { create: state.fundingCreate, findMany: state.fundingFind },
      repayment: { findMany: state.repaymentFind, create: state.repaymentCreate },
    }),
  );
});

describe('financial Server Actions', () => {
  it('rejects anonymous or wrong-role operations before reading financial records', async () => {
    state.session = null;
    expect(await createOpportunity(null, creationForm())).toMatchObject({ ok: false });
    expect(await fundOpportunity(null, fundingForm('10'))).toMatchObject({ ok: false });
    expect(await repayOpportunity(null, fundingForm('10'))).toMatchObject({ ok: false });
    state.session = { privyUserId: 'investor', stellarAddress: 'GINVESTOR', role: 'Investor' };
    expect(await createOpportunity(null, creationForm())).toMatchObject({ ok: false });
    expect(await repayOpportunity(null, fundingForm('10'))).toMatchObject({ ok: false });
    expect(state.businessFind).not.toHaveBeenCalled();
    expect(state.transaction).not.toHaveBeenCalled();
  });

  it('requires verified KYB, underwriting and Passport before locking collateral', async () => {
    state.session = { privyUserId: 'business', stellarAddress: 'GBUSINESS', role: 'Business' };
    state.businessFind.mockResolvedValueOnce(null);
    expect(await createOpportunity(null, creationForm())).toMatchObject({ ok: false });
    expect(state.debit).not.toHaveBeenCalled();
    expect(await createOpportunity(null, creationForm())).toMatchObject({ ok: true });
    expect(state.debit).toHaveBeenCalledOnce();
    expect(state.opportunityCreate).toHaveBeenCalledOnce();
    expect(state.debit.mock.invocationCallOrder[0]!).toBeLessThan(
      state.opportunityCreate.mock.invocationCallOrder[0]!,
    );
    expect(state.opportunityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ businessId: 'business-1', riskBand: 'C' }),
      }),
    );
  });

  it('does not let a sandbox acceptance create a financing opportunity', async () => {
    state.session = { privyUserId: 'business', stellarAddress: 'GBUSINESS', role: 'Business' };
    const valid = await state.businessFind();
    state.businessFind.mockResolvedValueOnce({
      ...valid,
      kybSubmissions: [{ ...valid.kybSubmissions[0], provider: 'sandbox' }],
    });
    expect(await createOpportunity(null, creationForm())).toMatchObject({ ok: false });
    expect(state.debit).not.toHaveBeenCalled();
    expect(state.opportunityCreate).not.toHaveBeenCalled();
  });

  it('rejects self-funding and overfunding without debiting or recording a funding', async () => {
    state.opportunityFind.mockResolvedValueOnce({
      id: 'loan-1',
      amount: '100',
      funded: '0',
      status: 'Open',
      business: { stellarAddress: 'GINVESTOR' },
    });
    expect(await fundOpportunity(null, fundingForm('10'))).toMatchObject({ ok: false });
    expect(await fundOpportunity(null, fundingForm('101'))).toMatchObject({ ok: false });
    expect(state.debit).not.toHaveBeenCalled();
    expect(state.fundingCreate).not.toHaveBeenCalled();
  });

  it('blocks funding an old open opportunity when its business has only sandbox KYB', async () => {
    const valid = await state.businessFind();
    state.businessFind.mockResolvedValueOnce({
      ...valid,
      kybSubmissions: [{ ...valid.kybSubmissions[0], provider: 'sandbox' }],
    });
    expect(await fundOpportunity(null, fundingForm('10'))).toMatchObject({ ok: false });
    expect(state.debit).not.toHaveBeenCalled();
    expect(state.fundingCreate).not.toHaveBeenCalled();
  });

  it('funds exactly to the principal and pays the verified business once', async () => {
    expect(await fundOpportunity(null, fundingForm('100'))).toMatchObject({ ok: true });
    expect(state.debit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        address: 'GINVESTOR',
        amountStroops: 1_000_000_000n,
      }),
    );
    expect(state.credit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        address: 'GBUSINESS',
        amountStroops: 1_000_000_000n,
      }),
    );
    expect(state.opportunityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { funded: '100', status: 'Funded' },
      }),
    );
  });

  it('prevents a different business from repaying another business loan', async () => {
    state.session = { privyUserId: 'other', stellarAddress: 'GOTHER', role: 'Business' };
    expect(await repayOpportunity(null, fundingForm('10'))).toMatchObject({
      ok: false,
      error: 'Loan not found.',
    });
    expect(state.debit).not.toHaveBeenCalled();
    expect(state.repaymentCreate).not.toHaveBeenCalled();
  });

  it('distributes a partial repayment to the investor without releasing collateral', async () => {
    state.session = { privyUserId: 'business', stellarAddress: 'GBUSINESS', role: 'Business' };
    state.opportunityFind.mockResolvedValueOnce({
      id: 'loan-1',
      title: 'Working capital',
      amount: '100',
      aprBps: 1800,
      termDays: 90,
      status: 'Funded',
      riskBand: 'C',
      business: { stellarAddress: 'GBUSINESS' },
    });
    expect(await repayOpportunity(null, fundingForm('10'))).toMatchObject({ ok: true });
    expect(state.debit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        address: 'GBUSINESS',
        amountStroops: 100_000_000n,
      }),
    );
    expect(state.credit).toHaveBeenCalledOnce();
    expect(state.credit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        address: 'GINVESTOR',
        amountStroops: 100_000_000n,
      }),
    );
    expect(state.opportunityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'Active' },
      }),
    );
  });
});
