import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  transaction: vi.fn(),
  findBusiness: vi.fn(),
  findEvidence: vi.fn(),
  findRecentView: vi.fn(),
  createEvent: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  describeError: (error: unknown) => String(error),
  privyClient: () => null,
}));
vi.mock('@fondealo/database', () => ({ prisma: { $transaction: state.transaction } }));
const { getLoginEmail, getMyData } = await import('./my-data');

beforeEach(() => {
  vi.clearAllMocks();
  state.findBusiness.mockResolvedValue({
    id: 'business-1',
    legalName: 'Café Andino SAC',
    country: 'Peru',
    taxId: '20123456781',
    sector: 'Retail',
    foundedYear: 2019,
    revenueBand: 'Under $5k / month',
    email: 'finanzas@cafe.pe',
    kybSubmissions: [
      {
        id: 'sub-1',
        fields: { representativeName: 'Ana', commitmentSalt: 'secret' },
        consentVersion: 'kyb-intake-v1',
        consentAt: new Date('2026-10-01T15:00:00Z'),
      },
    ],
    verificationAuditEvents: [],
  });
  state.findEvidence.mockResolvedValue([{ kind: 'tax-id' }]);
  state.findRecentView.mockResolvedValue(null);
  state.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      business: { findUnique: state.findBusiness },
      evidenceReference: { findMany: state.findEvidence },
      verificationAuditEvent: { findFirst: state.findRecentView, create: state.createEvent },
    }),
  );
});

describe('getMyData', () => {
  it('audits the first read and never returns the commitment salt', async () => {
    const data = await getMyData('GOWNER', 'owner');
    expect(state.createEvent).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(data)).not.toContain('secret');
    expect(data?.declaredEvidence).toEqual(['tax-id']);
  });

  it('does not write another audit row for a repeat view inside the window', async () => {
    state.findRecentView.mockResolvedValue({ id: 'evt-1' });
    await getMyData('GOWNER', 'owner');
    expect(state.createEvent).not.toHaveBeenCalled();
  });

  it('returns null rather than unaudited data when the database fails', async () => {
    state.transaction.mockRejectedValue(new Error('down'));
    expect(await getMyData('GOWNER', 'owner')).toBeNull();
  });

  it('shows no login email when Privy is not configured', async () => {
    expect(await getLoginEmail('owner')).toBeNull();
  });
});
