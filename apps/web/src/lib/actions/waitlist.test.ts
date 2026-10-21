import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  count: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (name: string) => state.headers.get(name) ?? null }),
}));
vi.mock('@/lib/auth/session', () => ({ describeError: (error: unknown) => String(error) }));
// Only the waitlist table exists on this mock: touching UserWallet,
// Business or KybSubmission would throw and fail the test.
vi.mock('@fondealo/database', () => ({
  prisma: {
    waitlistEntry: { count: state.count, findUnique: state.findUnique, create: state.create },
  },
}));

const { joinWaitlist } = await import('./waitlist');

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const valid = {
  email: '  Ana@Startup.PE ',
  profile: 'StartupPreSeed',
  country: 'Peru',
  companyName: 'Kallpa Labs',
  consent: 'on',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  state.headers = new Map([['x-forwarded-for', '203.0.113.7, 10.0.0.1']]);
  state.count.mockResolvedValue(0);
  state.findUnique.mockResolvedValue(null);
  state.create.mockResolvedValue({ id: 'w1' });
});

describe('joinWaitlist', () => {
  it('stores one minimal entry with a normalized email and the consent version', async () => {
    expect(await joinWaitlist(null, form(valid))).toEqual({ ok: true, email: 'ana@startup.pe' });
    expect(state.create).toHaveBeenCalledTimes(1);
    const { data } = state.create.mock.calls[0]![0];
    expect(data).toMatchObject({
      email: 'ana@startup.pe',
      profile: 'StartupPreSeed',
      country: 'Peru',
      companyName: 'Kallpa Labs',
      interviewOptIn: false,
      consentVersion: 'waitlist-v1',
      ipHash: null,
    });
    expect(data.consentAt).toBeInstanceOf(Date);
    expect(Object.keys(data).sort()).toEqual(
      [
        'companyName',
        'consentAt',
        'consentVersion',
        'country',
        'email',
        'interviewOptIn',
        'ipHash',
        'profile',
      ].sort(),
    );
  });

  it('records the optional interview opt-in and drops an empty company name', async () => {
    await joinWaitlist(null, form({ ...valid, companyName: '   ', interviewOptIn: 'on' }));
    expect(state.create.mock.calls[0]![0].data).toMatchObject({
      companyName: null,
      interviewOptIn: true,
    });
  });

  it.each([
    [{ ...valid, email: 'ana.startup.pe' }, 'email'],
    [{ ...valid, email: '' }, 'email'],
    [{ ...valid, profile: 'Investor' }, 'profile'],
    [{ ...valid, country: 'Atlantis' }, 'country'],
    [{ ...valid, companyName: 'x'.repeat(121) }, 'companyName'],
    [Object.fromEntries(Object.entries(valid).filter(([k]) => k !== 'consent')), 'consent'],
  ])(
    'rejects invalid input per field without touching the database (%#)',
    async (fields, field) => {
      const result = await joinWaitlist(null, form(fields as Record<string, string>));
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.fieldErrors?.[field as 'email']).toBeTruthy();
      expect(state.findUnique).not.toHaveBeenCalled();
      expect(state.create).not.toHaveBeenCalled();
    },
  );

  it('answers a known address exactly like a new one and never overwrites it', async () => {
    state.findUnique.mockResolvedValue({ id: 'existing' });
    expect(await joinWaitlist(null, form({ ...valid, profile: 'Funder' }))).toEqual({
      ok: true,
      email: 'ana@startup.pe',
    });
    expect(state.create).not.toHaveBeenCalled();
  });

  it('treats a concurrent duplicate (unique violation) as success', async () => {
    state.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    expect(await joinWaitlist(null, form(valid))).toMatchObject({ ok: true });
  });

  it('silently accepts a filled honeypot without writing anything', async () => {
    expect(await joinWaitlist(null, form({ ...valid, website: 'http://spam' }))).toMatchObject({
      ok: true,
    });
    expect(state.findUnique).not.toHaveBeenCalled();
    expect(state.create).not.toHaveBeenCalled();
  });

  it('stores only an HMAC of the first forwarded IP when a secret is configured', async () => {
    vi.stubEnv('WAITLIST_IP_SECRET', 'test-secret');
    await joinWaitlist(null, form(valid));
    const expected = createHmac('sha256', 'test-secret').update('203.0.113.7').digest('hex');
    expect(state.create.mock.calls[0]![0].data.ipHash).toBe(expected);
    expect(JSON.stringify(state.create.mock.calls[0]![0])).not.toContain('203.0.113.7');
  });

  it('rate-limits repeated entries from the same hashed IP', async () => {
    vi.stubEnv('WAITLIST_IP_SECRET', 'test-secret');
    state.count.mockResolvedValue(5);
    const result = await joinWaitlist(null, form(valid));
    expect(result).toMatchObject({ ok: false });
    expect(state.create).not.toHaveBeenCalled();
  });

  it('skips rate limiting (and stores no IP data) without a secret', async () => {
    await joinWaitlist(null, form(valid));
    expect(state.count).not.toHaveBeenCalled();
  });

  it('answers in English and stores the English consent version for locale=en', async () => {
    const bad = await joinWaitlist(null, form({ ...valid, email: 'nope', locale: 'en' }));
    expect(bad).toMatchObject({ ok: false, error: 'Check the highlighted fields.' });
    expect(bad.ok === false && bad.fieldErrors?.email).toMatch(/Check your email/);
    await joinWaitlist(null, form({ ...valid, locale: 'en' }));
    expect(state.create.mock.calls[0]![0].data.consentVersion).toBe('waitlist-v1-en');
  });

  it('fails visibly, without leaking details, when the database is down', async () => {
    state.findUnique.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const result = await joinWaitlist(null, form(valid));
    expect(result).toMatchObject({ ok: false });
    expect(JSON.stringify(result)).not.toContain('ECONNREFUSED');
  });
});
