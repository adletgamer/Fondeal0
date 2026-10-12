import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string | null;
    role: 'Business' | 'Investor' | null;
  },
  findFirst: vi.fn(),
  transaction: vi.fn(),
  businessUpsert: vi.fn(),
  submissionCreate: vi.fn(),
  passportUpsert: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: async () => state.session,
  describeError: (error: unknown) => String(error),
}));
vi.mock('@fondealo/database', () => ({
  prisma: { kybSubmission: { findFirst: state.findFirst }, $transaction: state.transaction },
}));
vi.mock('next/cache', () => ({ revalidatePath: state.revalidate }));
const { submitKyb } = await import('./kyb');

function form(taxId = '20123456781'): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    legalName: 'Sample Company',
    country: 'Peru',
    taxId,
    sector: 'Retail',
    foundedYear: '2020',
    revenueBand: 'Under $5k / month',
    email: 'team@example.com',
    verifierId: 'sandbox',
    accept: 'on',
  }))
    data.set(key, value);
  for (const doc of ['registration', 'tax-id', 'ownership', 'address']) data.append('docs', doc);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.session = { privyUserId: 'user', stellarAddress: 'GVERIFIED', role: 'Business' };
  state.findFirst.mockResolvedValue(null);
  state.businessUpsert.mockResolvedValue({ id: 'business-1' });
  state.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      business: { upsert: state.businessUpsert },
      kybSubmission: { create: state.submissionCreate },
      passportProjection: { upsert: state.passportUpsert },
    }),
  );
});

describe('sandbox KYB', () => {
  it('rejects anonymous and investor requests before reading business data', async () => {
    state.session = null;
    expect(await submitKyb(null, form())).toMatchObject({ ok: false });
    state.session = { privyUserId: 'user', stellarAddress: 'GINVESTOR', role: 'Investor' };
    expect(await submitKyb(null, form())).toMatchObject({ ok: false });
    expect(state.findFirst).not.toHaveBeenCalled();
    expect(state.transaction).not.toHaveBeenCalled();
  });

  it('rejects malformed tax IDs before any write', async () => {
    expect(await submitKyb(null, form('123'))).toMatchObject({ ok: false });
    expect(state.transaction).not.toHaveBeenCalled();
  });

  it('binds a pending application to the session address without issuing a Passport', async () => {
    expect(await submitKyb(null, form())).toMatchObject({ ok: true, status: 'Processing' });
    expect(state.businessUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stellarAddress: 'GVERIFIED' },
        create: expect.objectContaining({ stellarAddress: 'GVERIFIED' }),
      }),
    );
    expect(state.submissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'Processing',
          businessId: 'business-1',
          reviewedAt: null,
        }),
      }),
    );
    expect(state.passportUpsert).not.toHaveBeenCalled();
  });

  it('does not turn a sandbox rejection signal into a real KYB rejection', async () => {
    expect(await submitKyb(null, form('20123450000'))).toMatchObject({
      ok: true,
      status: 'Processing',
    });
    expect(state.submissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'Processing',
          fields: expect.objectContaining({ sandboxFormatPass: false }),
        }),
      }),
    );
    expect(state.passportUpsert).not.toHaveBeenCalled();
  });

  it('rejects duplicate in-progress applications', async () => {
    state.findFirst.mockResolvedValueOnce({ id: 'existing' });
    expect(await submitKyb(null, form())).toMatchObject({ ok: false });
    expect(state.transaction).not.toHaveBeenCalled();
  });
});
