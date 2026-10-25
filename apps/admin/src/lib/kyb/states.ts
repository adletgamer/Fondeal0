import type { CaseStatus, DecisionKind } from './types';

export const STATUS_LABEL: Record<CaseStatus, string> = {
  Received: 'Recibido',
  InReview: 'En revisión',
  NeedsInformation: 'Falta información',
  Approved: 'Aprobado',
  Rejected: 'Rechazado',
  ReviewDue: 'Revisión vencida',
};

export const KIND_LABEL: Record<DecisionKind, string> = {
  Claim: 'tomar el caso',
  RequestInformation: 'pedir información',
  Approve: 'aprobar',
  Reject: 'rechazar',
  Reopen: 'reabrir',
};

const TRANSITIONS: Record<CaseStatus, Partial<Record<DecisionKind, CaseStatus>>> = {
  Received: { Claim: 'InReview' },
  InReview: { RequestInformation: 'NeedsInformation', Approve: 'Approved', Reject: 'Rejected' },
  NeedsInformation: { Reopen: 'InReview', Reject: 'Rejected' },
  // Re-review before expiry, an appeal, and an expired approval all reopen the case.
  Approved: { Reopen: 'InReview' },
  Rejected: { Reopen: 'InReview' },
  ReviewDue: { Reopen: 'InReview' },
};

export function nextStatus(from: CaseStatus, kind: DecisionKind): CaseStatus | null {
  return TRANSITIONS[from][kind] ?? null;
}

export function allowedKinds(from: CaseStatus): DecisionKind[] {
  return Object.keys(TRANSITIONS[from]) as DecisionKind[];
}

/**
 * The `KybStatus` the existing schema stores. Only a human approval maps to
 * `Accepted`; every open state is `Processing`.
 */
export function toKybStatus(status: CaseStatus): 'Processing' | 'Accepted' | 'Rejected' {
  if (status === 'Approved') return 'Accepted';
  if (status === 'Rejected') return 'Rejected';
  return 'Processing';
}
