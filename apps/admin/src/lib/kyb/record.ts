import { createHash, randomBytes } from 'node:crypto';
import { APPROVAL_VALIDITY_DAYS, POLICY_VERSION } from './policy';
import type { DecisionCheck, DecisionInput } from './decision';
import type {
  CaseStatus,
  ChecklistAnswer,
  DecisionKind,
  EvidenceSource,
  SeparationMode,
} from './types';

/**
 * The record of one KYB decision (docs/adr/0011). Server-only: it hashes and
 * salts. Stored append-only; the case state is derived from the latest record.
 */

/** JSON with sorted keys, so the same content always hashes the same. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

const sha256 = (s: string) => `0x${createHash('sha256').update(s).digest('hex')}`;

/** What the reviewer saw when deciding. Evidence can change later; this cannot. */
export interface EvidenceSnapshot {
  caseId: string;
  submissionId: string;
  /** The intake's own salted commitment (`KybSubmission.dataHash`). */
  submissionDataHash: string | null;
  evidence: { kind: string; source: EvidenceSource; state: string }[];
  checks: { provider: string; checkType: string; result: string }[];
  checklist: ChecklistAnswer[];
}

export function evidenceSnapshotHash(snapshot: EvidenceSnapshot): string {
  return sha256(canonicalJson({ domain: 'fondealo:kyb-evidence:v1', ...snapshot }));
}

export interface DecisionRecord {
  id: string;
  caseId: string;
  submissionId: string;
  kind: DecisionKind;
  fromStatus: CaseStatus;
  toStatus: CaseStatus;
  actorId: string;
  preparedBy: string | null;
  separation: SeparationMode;
  policyVersion: string;
  reasonCodes: string[];
  checklist: ChecklistAnswer[];
  evidenceSnapshotHash: string;
  decidedAt: string;
  /** Approvals only: when the case returns to review. */
  expiresAt: string | null;
}

/** Builds the record from a decision that `validateDecision` already accepted. */
export function buildDecisionRecord(args: {
  id: string;
  input: DecisionInput;
  check: Extract<DecisionCheck, { ok: true }>;
  snapshot: EvidenceSnapshot;
  now: Date;
}): DecisionRecord {
  const { id, input, check, snapshot, now } = args;
  const approve = input.kind === 'Approve';
  return {
    id,
    caseId: snapshot.caseId,
    submissionId: snapshot.submissionId,
    kind: input.kind,
    fromStatus: input.from,
    toStatus: check.to,
    actorId: input.actor.id,
    preparedBy: input.preparedBy,
    separation: input.separation,
    policyVersion: POLICY_VERSION,
    reasonCodes: check.reasonCodes,
    checklist: approve ? input.checklist : [],
    evidenceSnapshotHash: evidenceSnapshotHash(snapshot),
    decidedAt: now.toISOString(),
    expiresAt: approve
      ? new Date(now.getTime() + APPROVAL_VALIDITY_DAYS * 86_400_000).toISOString()
      : null,
  };
}

export const CREDENTIAL_KIND = 'KYB';

/**
 * The value published on-chain as the KYB credential's `data_hash` through the
 * Passport contract's `add_credential`. It commits to the decision, the policy
 * version, the evidence snapshot and the expiry, with a random 32-byte salt
 * that never leaves the server, so nothing about the company (least of all an
 * enumerable tax number) can be guessed from it. Whoever is given the record
 * and the salt can recompute it and check it against the chain.
 */
export function credentialCommitment(record: DecisionRecord, salt: string): string {
  if (record.kind !== 'Approve' || !record.expiresAt) {
    throw new Error('Only an approval produces a KYB credential.');
  }
  if (!/^[0-9a-f]{64}$/.test(salt)) throw new Error('Salt must be 32 random bytes in hex.');
  return sha256(
    canonicalJson({
      domain: 'fondealo:kyb-credential:v1',
      credentialType: 'KYB_VERIFIED',
      salt,
      decisionId: record.id,
      policyVersion: record.policyVersion,
      evidenceSnapshotHash: record.evidenceSnapshotHash,
      issuedAt: record.decidedAt,
      expiresAt: record.expiresAt,
    }),
  );
}

export function newCommitmentSalt(): string {
  return randomBytes(32).toString('hex');
}
