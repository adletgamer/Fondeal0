import { describe, expect, it } from 'vitest';
import { allowedKinds, nextStatus, toKybStatus } from './states';
import type { CaseStatus, DecisionKind } from './types';

const ALL: CaseStatus[] = [
  'Received',
  'InReview',
  'NeedsInformation',
  'Approved',
  'Rejected',
  'ReviewDue',
];

describe('case state machine', () => {
  it('only a human decision from review can approve', () => {
    for (const from of ALL) {
      const to = nextStatus(from, 'Approve');
      expect(to).toBe(from === 'InReview' ? 'Approved' : null);
    }
  });

  it('a new case must be claimed before anything else', () => {
    expect(allowedKinds('Received')).toEqual(['Claim']);
    for (const k of ['Approve', 'Reject', 'RequestInformation', 'Reopen'] as DecisionKind[]) {
      expect(nextStatus('Received', k)).toBeNull();
    }
  });

  it('every closed or stalled state can be reopened, and reopening lands in review', () => {
    for (const from of ['NeedsInformation', 'Approved', 'Rejected', 'ReviewDue'] as CaseStatus[]) {
      expect(nextStatus(from, 'Reopen')).toBe('InReview');
    }
  });

  it('maps to the stored KYB status: only Approved is Accepted', () => {
    expect(toKybStatus('Approved')).toBe('Accepted');
    expect(toKybStatus('Rejected')).toBe('Rejected');
    for (const s of ['Received', 'InReview', 'NeedsInformation', 'ReviewDue'] as CaseStatus[]) {
      expect(toKybStatus(s)).toBe('Processing');
    }
  });
});
