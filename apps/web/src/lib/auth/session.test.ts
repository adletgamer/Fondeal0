import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  cookie: vi.fn(),
  verify: vi.fn(),
  getUser: vi.fn(),
  walletFind: vi.fn(),
  walletUpsert: vi.fn(),
  walletUpdate: vi.fn(),
}));

vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: state.cookie }) }));
vi.mock('@privy-io/server-auth', () => ({
  PrivyClient: class {
    verifyAuthToken = state.verify;
    getUserById = state.getUser;
  },
}));
vi.mock('@fondealo/database', () => ({
  prisma: {
    userWallet: {
      findUnique: state.walletFind,
      upsert: state.walletUpsert,
      update: state.walletUpdate,
    },
  },
}));

const { getSession } = await import('./session');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'test-app';
  process.env.PRIVY_APP_SECRET = 'test-secret';
  state.cookie.mockReturnValue(undefined);
  state.verify.mockResolvedValue({ userId: 'verified-privy-user' });
  state.walletFind.mockResolvedValue({
    privyUserId: 'verified-privy-user',
    stellarAddress: 'GVERIFIED',
    role: 'Investor',
    lastLoginAt: new Date(),
  });
});

describe('server identity resolution', () => {
  it('does not look up a user when the cookie is absent', async () => {
    expect(await getSession()).toBeNull();
    expect(state.verify).not.toHaveBeenCalled();
    expect(state.walletFind).not.toHaveBeenCalled();
  });

  it('rejects a tampered cookie before looking up a wallet', async () => {
    state.cookie.mockReturnValue({ value: 'tampered' });
    state.verify.mockRejectedValue(new Error('invalid signature'));
    expect(await getSession()).toBeNull();
    expect(state.walletFind).not.toHaveBeenCalled();
  });

  it('uses the verified Privy identity and persisted role', async () => {
    state.cookie.mockReturnValue({ value: 'valid' });
    expect(await getSession()).toEqual({
      privyUserId: 'verified-privy-user',
      stellarAddress: 'GVERIFIED',
      role: 'Investor',
    });
    expect(state.walletFind).toHaveBeenCalledWith({
      where: { privyUserId: 'verified-privy-user' },
    });
  });

  it('does not invent a wallet or role while Privy wallet creation is pending', async () => {
    state.cookie.mockReturnValue({ value: 'valid' });
    state.walletFind.mockResolvedValue(null);
    state.getUser.mockResolvedValue({ linkedAccounts: [] });
    expect(await getSession()).toEqual({
      privyUserId: 'verified-privy-user',
      stellarAddress: null,
      role: null,
    });
    expect(state.walletUpsert).not.toHaveBeenCalled();
  });
});
