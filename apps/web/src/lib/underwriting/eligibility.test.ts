import { describe, expect, it } from 'vitest';
import { canRequestFinancing } from './eligibility';

const now = new Date('2026-10-11T00:00:00Z');
const approved = {
  kyb: {
    id: 'kyb-1',
    status: 'Accepted' as const,
    provider: 'registry',
    reviewedAt: new Date('2026-10-10T00:00:00Z'),
    dataHash: '0xabc',
  },
  decision: {
    status: 'Approved' as const,
    kybSubmissionId: 'kyb-1',
    policyVersion: 'v1',
    evidenceRefs: ['registry-case-1'],
    decidedBy: 'reviewer-1',
    maxPrincipalStroops: 2_000_000_000n,
    maxTermDays: 180,
    expiresAt: new Date('2026-11-11T00:00:00Z'),
  },
  passport: { kybStatus: 'Accepted' as const, dataHash: '0xabc' },
  amountStroops: 1_000_000_000n,
  termDays: 90,
  now,
};

describe('business financing eligibility', () => {
  it('requires a current verified KYB, reviewed risk decision and matching Passport', () => {
    expect(canRequestFinancing(approved)).toBe(true);
    expect(canRequestFinancing({ ...approved, kyb: null })).toBe(false);
    expect(
      canRequestFinancing({ ...approved, kyb: { ...approved.kyb, provider: 'sandbox' } }),
    ).toBe(false);
    expect(
      canRequestFinancing({ ...approved, kyb: { ...approved.kyb, status: 'Processing' } }),
    ).toBe(false);
    expect(
      canRequestFinancing({ ...approved, passport: { ...approved.passport, dataHash: 'old' } }),
    ).toBe(false);
    expect(canRequestFinancing({ ...approved, decision: null })).toBe(false);
    expect(
      canRequestFinancing({ ...approved, decision: { ...approved.decision, status: 'Review' } }),
    ).toBe(false);
  });

  it('rejects stale, unsupported or unevidenced decisions and excessive terms', () => {
    expect(
      canRequestFinancing({ ...approved, decision: { ...approved.decision, expiresAt: now } }),
    ).toBe(false);
    expect(
      canRequestFinancing({ ...approved, decision: { ...approved.decision, evidenceRefs: [] } }),
    ).toBe(false);
    expect(
      canRequestFinancing({ ...approved, decision: { ...approved.decision, decidedBy: null } }),
    ).toBe(false);
    expect(canRequestFinancing({ ...approved, amountStroops: 3_000_000_000n })).toBe(false);
    expect(canRequestFinancing({ ...approved, termDays: 181 })).toBe(false);
  });
});
