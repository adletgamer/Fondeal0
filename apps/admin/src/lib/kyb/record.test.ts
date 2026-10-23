import { describe, expect, it } from 'vitest';
import { validateDecision, type DecisionInput } from './decision';
import { POLICY_VERSION, REQUIRED_ITEM_IDS } from './policy';
import {
  buildDecisionRecord,
  canonicalJson,
  credentialCommitment,
  evidenceSnapshotHash,
  newCommitmentSalt,
  type EvidenceSnapshot,
} from './record';

const now = new Date('2026-10-22T15:00:00Z');
const input: DecisionInput = {
  kind: 'Approve',
  from: 'InReview',
  actor: { id: 'approver', roles: ['Approver'], status: 'Active' },
  preparedBy: 'reviewer',
  separation: 'enforced',
  checklist: REQUIRED_ITEM_IDS.map((itemId) => ({
    itemId,
    outcome: 'Confirmed' as const,
    source: 'official-registry' as const,
    note: '',
  })),
  reasonCodes: [],
  note: '',
  env: 'testnet',
};
const snapshot: EvidenceSnapshot = {
  caseId: 'case-1',
  submissionId: 'sub-1',
  submissionDataHash: '0xabc',
  evidence: [{ kind: 'Ficha RUC', source: 'official-registry', state: 'Verified' }],
  checks: [{ provider: 'sandbox', checkType: 'format', result: 'SyntheticPass' }],
  checklist: input.checklist,
};
const approve = () => {
  const check = validateDecision(input);
  if (!check.ok) throw new Error(check.errors.join());
  return buildDecisionRecord({ id: 'dec-1', input, check, snapshot, now });
};

describe('canonical JSON', () => {
  it('does not depend on key order', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: [3, { f: 1, e: 0 }] } })).toBe(
      canonicalJson({ a: { c: [3, { e: 0, f: 1 }], d: 2 }, b: 1 }),
    );
  });
  it('keeps array order', () => {
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
  });
});

describe('evidence snapshot hash', () => {
  it('is stable and changes when any evidence changes', () => {
    const h = evidenceSnapshotHash(snapshot);
    expect(h).toMatch(/^0x[0-9a-f]{64}$/);
    expect(evidenceSnapshotHash({ ...snapshot })).toBe(h);
    expect(
      evidenceSnapshotHash({
        ...snapshot,
        evidence: [{ kind: 'Ficha RUC', source: 'declared-only', state: 'Declared' }],
      }),
    ).not.toBe(h);
  });
});

describe('decision record', () => {
  it('records the policy version, both people, the snapshot and an expiry for approvals', () => {
    const r = approve();
    expect(r).toMatchObject({
      kind: 'Approve',
      fromStatus: 'InReview',
      toStatus: 'Approved',
      actorId: 'approver',
      preparedBy: 'reviewer',
      separation: 'enforced',
      policyVersion: POLICY_VERSION,
      reasonCodes: ['POLICY_MET'],
      evidenceSnapshotHash: evidenceSnapshotHash(snapshot),
      decidedAt: '2026-10-22T15:00:00.000Z',
      expiresAt: '2027-10-22T15:00:00.000Z',
    });
  });

  it('other decisions carry no expiry and no checklist', () => {
    const i: DecisionInput = {
      ...input,
      kind: 'RequestInformation',
      reasonCodes: ['MISSING_OWNERSHIP'],
    };
    const check = validateDecision(i);
    if (!check.ok) throw new Error(check.errors.join());
    const r = buildDecisionRecord({ id: 'dec-2', input: i, check, snapshot, now });
    expect(r.expiresAt).toBeNull();
    expect(r.checklist).toEqual([]);
  });
});

describe('credential commitment (the on-chain data_hash)', () => {
  const salt = 'ab'.repeat(32);

  it('is deterministic for the same record and salt', () => {
    expect(credentialCommitment(approve(), salt)).toBe(credentialCommitment(approve(), salt));
  });

  it('changes with the salt, so it cannot be guessed from public facts', () => {
    expect(credentialCommitment(approve(), salt)).not.toBe(
      credentialCommitment(approve(), 'cd'.repeat(32)),
    );
  });

  it('changes with the policy version or the evidence', () => {
    const base = credentialCommitment(approve(), salt);
    expect(credentialCommitment({ ...approve(), policyVersion: 'kyb-v2' }, salt)).not.toBe(base);
    expect(credentialCommitment({ ...approve(), evidenceSnapshotHash: '0x00' }, salt)).not.toBe(
      base,
    );
  });

  it('only exists for approvals and needs a real salt', () => {
    const rejected = { ...approve(), kind: 'Reject' as const, expiresAt: null };
    expect(() => credentialCommitment(rejected, salt)).toThrow();
    expect(() => credentialCommitment(approve(), 'short')).toThrow();
    expect(newCommitmentSalt()).toMatch(/^[0-9a-f]{64}$/);
    expect(newCommitmentSalt()).not.toBe(newCommitmentSalt());
  });
});
