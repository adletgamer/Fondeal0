import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string | null;
    role: 'Business' | 'Investor' | null;
  },
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  transaction: vi.fn(),
  businessUpsert: vi.fn(),
  submissionCreate: vi.fn(),
  evidenceCreate: vi.fn(),
  providerCreate: vi.fn(),
  auditCreateMany: vi.fn(),
  passportUpsert: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: async () => state.session,
  describeError: (error: unknown) => String(error),
}));
vi.mock('@fondealo/database', () => ({
  prisma: { kybSubmission: { findUnique: state.findUnique }, $transaction: state.transaction },
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
    representativeName: 'Synthetic Representative',
    representativeRelationship: 'Owner',
    idempotencyKey: '39dc46da-fc68-41cb-b4bd-83fe8da523d8',
    verifierId: 'sandbox',
    accept: 'on',
    evidenceConsent: 'on',
  }))
    data.set(key, value);
  for (const doc of ['registration', 'tax-id']) data.append('docs', doc);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.session = { privyUserId: 'user', stellarAddress: 'GVERIFIED', role: 'Business' };
  state.findFirst.mockResolvedValue(null);
  state.findUnique.mockResolvedValue(null);
  state.businessUpsert.mockResolvedValue({ id: 'business-1' });
  state.submissionCreate.mockResolvedValue({ id: 'submission-1' });
  state.evidenceCreate.mockImplementation(async ({ data }: { data: { kind: string } }) => ({
    id: `evidence-${data.kind}`,
    kind: data.kind,
  }));
  state.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      business: { upsert: state.businessUpsert },
      kybSubmission: {
        create: state.submissionCreate,
        findFirst: state.findFirst,
        findUnique: state.findUnique,
      },
      evidenceReference: { create: state.evidenceCreate },
      providerCheck: { create: state.providerCreate },
      verificationAuditEvent: { createMany: state.auditCreateMany },
      passportProjection: { upsert: state.passportUpsert },
    }),
  );
});

describe('bilingual consent provenance', () => {
  it('records the English consent version without changing the pending trust state', async () => {
    const data = form();
    data.set('locale', 'en');
    expect(await submitKyb(null, data)).toMatchObject({ ok: true, status: 'Processing' });
    expect(state.submissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          consentVersion: 'kyb-intake-v1-en',
          status: 'Processing',
          reviewedAt: null,
        }),
      }),
    );
    expect(state.passportUpsert).not.toHaveBeenCalled();
  });
  it('rejects an unknown consent locale before persistence', async () => {
    const data = form();
    data.set('locale', 'invalid');
    expect(await submitKyb(null, data)).toMatchObject({ ok: false });
    expect(state.transaction).not.toHaveBeenCalled();
  });
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
    expect(state.providerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ result: 'SyntheticPass', sourceType: 'synthetic' }),
      }),
    );
    expect(state.auditCreateMany).toHaveBeenCalled();
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
    expect(state.businessUpsert).not.toHaveBeenCalled();
    expect(state.submissionCreate).not.toHaveBeenCalled();
  });

  it('requires explicit evidence consent and representative details', async () => {
    const noConsent = form();
    noConsent.delete('evidenceConsent');
    expect(await submitKyb(null, noConsent)).toMatchObject({ ok: false });
    const noRepresentative = form();
    noRepresentative.delete('representativeName');
    expect(await submitKyb(null, noRepresentative)).toMatchObject({ ok: false });
    expect(state.transaction).not.toHaveBeenCalled();
  });

  it('rejects document bytes in the declaration-only intake', async () => {
    const data = form();
    data.set('document', new File(['synthetic'], 'synthetic.pdf', { type: 'application/pdf' }));
    expect(await submitKyb(null, data)).toMatchObject({ ok: false });
    expect(state.transaction).not.toHaveBeenCalled();
  });

  it('ignores a forged Stellar address and keeps the verified session owner', async () => {
    const data = form();
    data.set('stellarAddress', 'GATTACKER');
    expect(await submitKyb(null, data)).toMatchObject({ ok: true });
    expect(state.businessUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stellarAddress: 'GVERIFIED' } }),
    );
  });

  it('returns the saved reference without repeating writes on retry', async () => {
    state.findUnique.mockResolvedValue({
      business: { stellarAddress: 'GVERIFIED' },
      providerRef: 'sbx_saved',
      status: 'Processing',
    });
    expect(await submitKyb(null, form())).toMatchObject({ ok: true, providerRef: 'sbx_saved' });
    expect(state.submissionCreate).not.toHaveBeenCalled();
    expect(state.providerCreate).not.toHaveBeenCalled();
  });

  it('does not reveal another business application through a reused token', async () => {
    state.findUnique.mockResolvedValue({
      business: { stellarAddress: 'GOTHER' },
      providerRef: 'sbx_private',
      status: 'Processing',
    });
    const result = await submitKyb(null, form());
    expect(result).toMatchObject({ ok: false });
    expect(JSON.stringify(result)).not.toContain('sbx_private');
    expect(state.submissionCreate).not.toHaveBeenCalled();
  });

  it('does not present a stale retry as a pending application', async () => {
    state.findUnique.mockResolvedValue({
      business: { stellarAddress: 'GVERIFIED' },
      providerRef: 'sbx_saved',
      status: 'Rejected',
    });
    expect(await submitKyb(null, form())).toMatchObject({ ok: false });
    expect(state.submissionCreate).not.toHaveBeenCalled();
  });

  it('returns the committed result after a concurrent idempotency conflict', async () => {
    state.transaction.mockRejectedValueOnce({ code: 'P2002' });
    state.findUnique.mockResolvedValueOnce({
      business: { stellarAddress: 'GVERIFIED' },
      providerRef: 'sbx_committed',
      status: 'Processing',
    });
    expect(await submitKyb(null, form())).toMatchObject({
      ok: true,
      providerRef: 'sbx_committed',
    });
  });

  it('fails closed when the database is unavailable', async () => {
    state.transaction.mockRejectedValue(new Error('database unavailable'));
    expect(await submitKyb(null, form())).toMatchObject({ ok: false });
    expect(state.providerCreate).not.toHaveBeenCalled();
  });
});
