/** Workflow state of a KYB case. Persisted decisions will derive it (docs/adr/0011). */
export type CaseStatus =
  'Received' | 'InReview' | 'NeedsInformation' | 'Approved' | 'Rejected' | 'ReviewDue';

export type DecisionKind = 'Claim' | 'RequestInformation' | 'Approve' | 'Reject' | 'Reopen';

export type StaffRole = 'Reviewer' | 'Approver';

/** Where a checked fact came from. Only the first three can confirm a policy item. */
export type EvidenceSource =
  'official-registry' | 'third-party' | 'reviewer-attested' | 'declared-only' | 'synthetic';

export type ChecklistOutcome = 'Confirmed' | 'NotConfirmed' | 'NotChecked';

export type AdminEnv = 'testnet' | 'production';

export interface ChecklistAnswer {
  itemId: string;
  outcome: ChecklistOutcome;
  source: EvidenceSource | null;
  /** What the reviewer checked, where and when. Required for `reviewer-attested`. */
  note: string;
}

export interface Reviewer {
  id: string;
  role: StaffRole;
}
