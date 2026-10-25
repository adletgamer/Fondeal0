import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string;
    role: 'Business' | 'Investor';
  },
  transaction: vi.fn(),
  findBusiness: vi.fn(),
  findEvent: vi.fn(),
  createEvent: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({
  getSession: async () => state.session,
  describeError: (error: unknown) => String(error),
}));
vi.mock('@fondealo/database', () => ({ prisma: { $transaction: state.transaction } }));
const { requestDataDeletion } = await import('./data-rights');

const form = new FormData();

beforeEach(() => {
  vi.clearAllMocks();
  state.session = { privyUserId: 'owner', stellarAddress: 'GOWNER', role: 'Business' };
  state.findBusiness.mockResolvedValue({ id: 'business-1', kybSubmissions: [{ id: 'sub-1' }] });
  state.findEvent.mockResolvedValue(null);
  state.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      business: { findUnique: state.findBusiness },
      verificationAuditEvent: { findFirst: state.findEvent, create: state.createEvent },
      businessProfileEvent: { findFirst: state.findEvent, create: state.createEvent },
    }),
  );
});

describe('data deletion request', () => {
  it('accepts deletion requests for profile-only companies without creating a KYB submission', async () => {
    state.findBusiness.mockResolvedValue({
      id: 'profile-business',
      kybSubmissions: [],
      financingProfile: { businessId: 'profile-business' },
    });
    expect(await requestDataDeletion(null, form)).toMatchObject({ ok: true });
    expect(state.createEvent).toHaveBeenCalledWith({
      data: {
        businessId: 'profile-business',
        actorPrivyUserId: 'owner',
        action: 'DeletionRequested',
      },
    });
  });
  it('refuses anonymous and investor sessions before touching the database', async () => {
    state.session = null;
    expect(await requestDataDeletion(null, form)).toMatchObject({ ok: false });
    state.session = { privyUserId: 'investor', stellarAddress: 'GINV', role: 'Investor' };
    expect(await requestDataDeletion(null, form)).toMatchObject({ ok: false });
    expect(state.transaction).not.toHaveBeenCalled();
  });

  it('records one audit event for the session owner only', async () => {
    expect(await requestDataDeletion(null, form)).toMatchObject({ ok: true });
    expect(state.findBusiness).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stellarAddress: 'GOWNER' } }),
    );
    expect(state.createEvent).toHaveBeenCalledWith({
      data: expect.objectContaining({
        businessId: 'business-1',
        kybSubmissionId: 'sub-1',
        actorPrivyUserId: 'owner',
        action: 'DeletionRequested',
      }),
    });
  });

  it('is idempotent', async () => {
    state.findEvent.mockResolvedValue({ createdAt: new Date('2026-10-01T12:00:00Z') });
    expect(await requestDataDeletion(null, form)).toMatchObject({ ok: true });
    expect(state.createEvent).not.toHaveBeenCalled();
  });

  it('reports when there is no business data to delete', async () => {
    state.findBusiness.mockResolvedValue(null);
    expect(await requestDataDeletion(null, form)).toMatchObject({ ok: false });
    expect(state.createEvent).not.toHaveBeenCalled();
  });

  it('fails visibly when the database is unreachable', async () => {
    state.transaction.mockRejectedValue(new Error('down'));
    expect(await requestDataDeletion(null, form)).toMatchObject({ ok: false });
  });
});
