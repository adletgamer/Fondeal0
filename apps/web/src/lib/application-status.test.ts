import { describe, expect, it } from 'vitest';
import type { KybState } from '@/lib/data/kyb';
import { applicationStatus } from './application-status';

const base: KybState = {
  status: 'None',
  legalName: null,
  country: null,
  sector: null,
  providerRef: null,
  provider: null,
  reviewedAt: null,
  underwritingStatus: null,
  eligible: false,
};
const kyb = (patch: Partial<KybState>): KybState => ({ ...base, ...patch });

describe('application status', () => {
  it('shows a recoverable error, not a form, when the database is unreachable', () => {
    const s = applicationStatus(null);
    expect(s.kind).toBe('unavailable');
    expect(s.canSubmit).toBe(false);
    expect(s.action?.href).toBe('/business/verify');
  });

  it('invites a first application', () => {
    const s = applicationStatus(base);
    expect(s.kind).toBe('none');
    expect(s.canSubmit).toBe(true);
    expect(s.steps?.[0]).toMatchObject({ key: 'received', state: 'current' });
  });

  it('explains that a sandbox application has no reviewer or deadline', () => {
    const s = applicationStatus(kyb({ status: 'Processing', provider: 'sandbox' }));
    expect(s.kind).toBe('processing');
    expect(s.body).toMatch(/modo de prueba/);
    expect(s.canSubmit).toBe(false);
    expect(s.steps?.map((x) => x.state)).toEqual(['done', 'current', 'upcoming', 'upcoming']);
  });

  it('lets a rejected business correct and resubmit', () => {
    const s = applicationStatus(kyb({ status: 'Rejected', provider: 'sandbox' }));
    expect(s.kind).toBe('rejected');
    expect(s.canSubmit).toBe(true);
    expect(s.steps?.[1]?.state).toBe('blocked');
  });

  it('never presents a sandbox acceptance as verified', () => {
    const s = applicationStatus(kyb({ status: 'Accepted', provider: 'sandbox' }));
    expect(s.kind).toBe('simulated');
    expect(s.tone).not.toBe('success');
    expect(s.canSubmit).toBe(true);
  });

  it('separates identity verification from the risk decision', () => {
    expect(applicationStatus(kyb({ status: 'Accepted', provider: 'registry' })).kind).toBe(
      'identity-verified',
    );
    const declined = applicationStatus(
      kyb({ status: 'Accepted', provider: 'registry', underwritingStatus: 'Declined' }),
    );
    expect(declined.kind).toBe('risk-declined');
    expect(declined.steps?.[2]?.state).toBe('blocked');
  });

  it('treats an approved but ineligible decision (e.g. expired) as pending, not verified', () => {
    const s = applicationStatus(
      kyb({ status: 'Accepted', provider: 'registry', underwritingStatus: 'Approved' }),
    );
    expect(s.kind).toBe('identity-verified');
  });

  it('only reaches verified through the financing eligibility check', () => {
    const s = applicationStatus(kyb({ status: 'Accepted', provider: 'registry', eligible: true }));
    expect(s.kind).toBe('verified');
    expect(s.steps?.every((x) => x.state === 'done')).toBe(true);
    expect(s.action?.href).toBe('/business/passport');
  });
});
