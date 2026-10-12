import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string;
    role: 'Business' | 'Investor';
  },
  transaction: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSession: async () => state.session }));
vi.mock('@fondealo/database', () => ({ prisma: { $transaction: state.transaction } }));
const { listDeclaredEvidence } = await import('./evidence');

beforeEach(() => {
  vi.clearAllMocks();
  state.session = { privyUserId: 'business-user', stellarAddress: 'GOWNER', role: 'Business' };
  state.findFirst.mockResolvedValue({ id: 'submission-1', businessId: 'business-1' });
  state.findMany.mockResolvedValue([{ kind: 'tax-id', status: 'Declared' }]);
  state.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      kybSubmission: { findFirst: state.findFirst },
      evidenceReference: { findMany: state.findMany },
      verificationAuditEvent: { create: state.auditCreate },
    }),
  );
});

describe('evidence metadata access', () => {
  it('rejects anonymous and investor requests before database access', async () => {
    state.session = null;
    expect(await listDeclaredEvidence('submission-1')).toMatchObject({ ok: false });
    state.session = { privyUserId: 'investor', stellarAddress: 'GINVESTOR', role: 'Investor' };
    expect(await listDeclaredEvidence('submission-1')).toMatchObject({ ok: false });
    expect(state.transaction).not.toHaveBeenCalled();
  });

  it('requires ownership and logs the metadata read without private keys', async () => {
    expect(await listDeclaredEvidence('submission-1')).toEqual({
      ok: true,
      items: [{ kind: 'tax-id', status: 'Declared' }],
    });
    expect(state.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'submission-1', business: { stellarAddress: 'GOWNER' } },
      }),
    );
    expect(state.auditCreate).toHaveBeenCalled();
    state.findFirst.mockResolvedValueOnce(null);
    expect(await listDeclaredEvidence('submission-other')).toMatchObject({ ok: false });
  });
});
