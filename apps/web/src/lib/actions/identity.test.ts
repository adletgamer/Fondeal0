import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  verify: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  session: null as null | {
    privyUserId: string;
    stellarAddress: string | null;
    role: 'Business' | 'Investor' | null;
  },
  updateMany: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: state.get, set: state.set, delete: state.del }),
}));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock('@/lib/auth/session', () => ({
  privyClient: () => ({ verifyAuthToken: state.verify }),
  getSession: async () => state.session,
  describeError: (error: unknown) => String(error),
}));
vi.mock('@fondealo/database', () => ({
  prisma: { userWallet: { updateMany: state.updateMany, findUnique: state.findUnique } },
}));

const { syncSession, clearSession } = await import('./session');
const { chooseRole } = await import('./onboarding');

beforeEach(() => {
  vi.clearAllMocks();
  state.session = null;
  state.get.mockReturnValue(undefined);
  state.verify.mockResolvedValue({ userId: 'verified-user' });
});

describe('Privy session cookie', () => {
  it('never stores an invalid access token', async () => {
    state.verify.mockRejectedValue(new Error('invalid signature'));
    expect(await syncSession('forged')).toEqual({ ok: false, changed: false });
    expect(state.set).not.toHaveBeenCalled();
  });

  it('stores a verified token with server-only cookie protections', async () => {
    expect(await syncSession('valid-token')).toEqual({ ok: true, changed: true });
    expect(state.set).toHaveBeenCalledWith(
      'fondealo_session',
      'valid-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
    state.get.mockReturnValue({ value: 'valid-token' });
    expect(await syncSession('valid-token')).toEqual({ ok: true, changed: false });
  });

  it('deletes the server session on logout', async () => {
    await clearSession();
    expect(state.del).toHaveBeenCalledWith('fondealo_session');
  });
});

describe('onboarding role', () => {
  it('refuses an anonymous request without a database write', async () => {
    expect(await chooseRole('Business')).toHaveProperty('error');
    expect(state.updateMany).not.toHaveBeenCalled();
  });

  it('requires the verified wallet before choosing a role', async () => {
    state.session = { privyUserId: 'user', stellarAddress: null, role: null };
    expect(await chooseRole('Business')).toHaveProperty('error');
    expect(state.updateMany).not.toHaveBeenCalled();
  });

  it('uses a conditional write and preserves the role that won a concurrent request', async () => {
    state.session = { privyUserId: 'user', stellarAddress: 'GBUSINESS', role: null };
    state.updateMany.mockResolvedValue({ count: 0 });
    state.findUnique.mockResolvedValue({ role: 'Investor' });
    await expect(chooseRole('Business')).rejects.toThrow('REDIRECT:/invest');
    expect(state.updateMany).toHaveBeenCalledWith({
      where: { privyUserId: 'user', role: null },
      data: { role: 'Business' },
    });
  });

  it('refuses new investor sign-ups unless the Testnet demo flag is on', async () => {
    state.session = { privyUserId: 'user', stellarAddress: 'GNEW', role: null };
    expect(await chooseRole('Investor')).toHaveProperty('error');
    expect(state.updateMany).not.toHaveBeenCalled();
  });

  it('keeps existing investor accounts reachable', async () => {
    state.session = { privyUserId: 'user', stellarAddress: 'GINVESTOR', role: 'Investor' };
    await expect(chooseRole('Investor')).rejects.toThrow('REDIRECT:/invest');
  });

  it('does not permit a user to replace an established role', async () => {
    state.session = { privyUserId: 'user', stellarAddress: 'GBUSINESS', role: 'Business' };
    await expect(chooseRole('Investor')).rejects.toThrow('REDIRECT:/business');
    expect(state.updateMany).not.toHaveBeenCalled();
  });
});
