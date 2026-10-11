import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string | null;
    role: 'Business' | 'Investor' | null;
  },
  grant: vi.fn(),
  credit: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: async () => state.session,
  describeError: (error: unknown) => String(error),
}));
vi.mock('@/lib/wallet/ledger', () => ({
  ensureInitialGrant: state.grant,
  credit: state.credit,
  usdcToStroops: (amount: number) => BigInt(Math.round(amount * 10_000_000)),
}));
vi.mock('@fondealo/database', () => ({ prisma: {} }));
vi.mock('next/cache', () => ({ revalidatePath: state.revalidate }));

const { depositTestFunds } = await import('./wallet');

function form(amount: string, providerId = 'sandbox-faucet'): FormData {
  const data = new FormData();
  data.set('amount', amount);
  data.set('providerId', providerId);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.session = { privyUserId: 'user', stellarAddress: 'GVERIFIED', role: 'Investor' };
});

describe('test-funds deposit', () => {
  it('rejects anonymous requests and amounts above the per-call limit', async () => {
    state.session = null;
    expect(await depositTestFunds(null, form('10'))).toMatchObject({ ok: false });
    state.session = { privyUserId: 'user', stellarAddress: 'GVERIFIED', role: 'Investor' };
    expect(await depositTestFunds(null, form('25001'))).toMatchObject({ ok: false });
    expect(state.credit).not.toHaveBeenCalled();
  });

  it('credits only the wallet attached to the verified session', async () => {
    const data = form('10');
    data.set('address', 'GATTACKER');
    expect(await depositTestFunds(null, data)).toMatchObject({ ok: true });
    expect(state.credit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        address: 'GVERIFIED',
        amountStroops: 100_000_000n,
      }),
    );
  });
});
