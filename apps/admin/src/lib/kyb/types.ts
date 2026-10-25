/** Workflow state of a KYB case. Persisted decisions will derive it (docs/adr/0011). */
export type CaseStatus =
  'Received' | 'InReview' | 'NeedsInformation' | 'Approved' | 'Rejected' | 'ReviewDue';

export type DecisionKind = 'Claim' | 'RequestInformation' | 'Approve' | 'Reject' | 'Reopen';

/** A person may hold several roles; the database decides which (docs/adr/0011). */
export type StaffRole = 'Reviewer' | 'Approver' | 'Admin';

export type StaffStatus = 'Active' | 'Suspended' | 'Revoked';

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

/** Who acts. Identity comes from the verified session, roles from `StaffMember`. */
export interface Actor {
  id: string;
  roles: readonly StaffRole[];
  status: StaffStatus;
}

/**
 * Maker-checker for approvals and rejections. `solo` lets the person who
 * prepared a case also decide it; it exists for a single operator on Testnet
 * and is never available in production.
 */
export type SeparationMode = 'enforced' | 'solo';
