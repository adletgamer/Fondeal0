import type { CaseStatus, EvidenceSource } from './kyb/types';

export type EvidenceState = 'Declared' | 'Verified' | 'Unavailable';

export interface EvidenceView {
  id: string;
  label: string;
  source: EvidenceSource;
  state: EvidenceState;
  detail: string;
}

export interface CheckView {
  id: string;
  provider: string;
  checkType: string;
  result: string;
  detail: string;
}

export interface TimelineEntry {
  at: string;
  actor: string;
  text: string;
}

export interface CaseView {
  id: string;
  legalName: string;
  country: string;
  taxIdLabel: string;
  taxId: string;
  sector: string;
  foundedYear: number;
  submittedAt: string;
  status: CaseStatus;
  assignedTo: string | null;
  /** Staff id of whoever claimed and prepared the case. */
  preparedBy: string | null;
  representative: { name: string; role: string; documentTail: string };
  consentVersion: string;
  evidence: EvidenceView[];
  checks: CheckView[];
  timeline: TimelineEntry[];
}
