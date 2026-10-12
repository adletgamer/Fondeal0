import type { KybSubmission, PassportProjection, UnderwritingDecision } from '@fondealo/database';

type Decision = Pick<
  UnderwritingDecision,
  | 'status'
  | 'kybSubmissionId'
  | 'policyVersion'
  | 'evidenceRefs'
  | 'decidedBy'
  | 'maxPrincipalStroops'
  | 'maxTermDays'
  | 'expiresAt'
>;

type Kyb = Pick<KybSubmission, 'id' | 'status' | 'provider' | 'reviewedAt' | 'dataHash'>;
type Passport = Pick<PassportProjection, 'kybStatus' | 'dataHash'>;

/** Fail closed when any trust-bearing input is missing, stale or from sandbox. */
export function canRequestFinancing(input: {
  kyb: Kyb | null;
  decision: Decision | null;
  passport: Passport | null;
  amountStroops: bigint;
  termDays: number;
  now: Date;
}): boolean {
  const { kyb, decision, passport, amountStroops, termDays, now } = input;
  if (!kyb || kyb.status !== 'Accepted' || kyb.provider === 'sandbox' || !kyb.reviewedAt)
    return false;
  if (!kyb.dataHash || !passport || passport.kybStatus !== 'Accepted') return false;
  if (passport.dataHash !== kyb.dataHash) return false;
  if (!decision || decision.status !== 'Approved' || decision.kybSubmissionId !== kyb.id)
    return false;
  if (!decision.policyVersion.trim() || !decision.decidedBy?.trim()) return false;
  if (!Array.isArray(decision.evidenceRefs) || decision.evidenceRefs.length === 0) return false;
  if (!decision.expiresAt || decision.expiresAt <= now) return false;
  if (!decision.maxPrincipalStroops || amountStroops > decision.maxPrincipalStroops) return false;
  if (!decision.maxTermDays || termDays > decision.maxTermDays) return false;
  return amountStroops > 0n && termDays > 0;
}
