import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCase, listCases } from './data';

afterEach(() => vi.unstubAllEnvs());
const now = new Date('2026-10-22T15:00:00Z');

describe('case data', () => {
  it('serves nothing when preview mode is off', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ADMIN_PREVIEW_FIXTURES', '0');
    expect(await listCases(now)).toEqual([]);
    expect(await getCase('case-kallpa', now)).toBeNull();
  });

  it('serves nothing on a production deployment, even with the old flag', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_ENV', 'production');
    vi.stubEnv('ADMIN_PREVIEW_FIXTURES', '1');
    expect(await listCases(now)).toEqual([]);
  });

  it('lists the oldest case first in preview', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const cases = await listCases(now);
    expect(cases.length).toBeGreaterThan(4);
    const times = cases.map((c) => c.submittedAt);
    expect(times).toEqual([...times].sort());
    expect(await getCase('case-qori', now)).toMatchObject({ status: 'Approved' });
    expect(await getCase('nope', now)).toBeNull();
  });

  it('example cases never carry a verified source that no human could have given', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const c of await listCases(now)) {
      for (const e of c.evidence) {
        if (e.state === 'Verified')
          expect(['reviewer-attested', 'official-registry', 'third-party']).toContain(e.source);
        if (e.source === 'declared-only') expect(e.state).toBe('Declared');
      }
    }
  });
});
