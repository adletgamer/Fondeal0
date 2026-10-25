import type { AuthorizationResult, EvidenceQuote, PaymentAuthorizer } from './spending-policy';

export type EvidenceRequest = {
  businessId: string;
  submissionId: string;
  country: string;
  subject: string;
  evidenceType: string;
  consentAt: Date | null;
  consentVersion: string | null;
  idempotencyKey: string;
  requestHash: string;
  now: Date;
};

export type RawEvidence = {
  providerId: string;
  checkType: string;
  subject: string;
  result: 'active' | 'inactive' | 'unknown';
  sourceType: 'synthetic';
  checkedAt: Date;
  expiresAt: Date;
  reasonCodes: string[];
  responseHash: string;
  paymentTxHash: string;
  paidAmount: string;
};

export interface EvidenceProvider {
  readonly id: string;
  readonly supportedCountries: ReadonlySet<string>;
  readonly supportedEvidenceTypes: ReadonlySet<string>;
  quote(input: EvidenceRequest): Promise<EvidenceQuote>;
  acquire(input: EvidenceRequest, quote: EvidenceQuote): Promise<RawEvidence>;
}

export type ExistingEvidence = {
  result: string;
  expiresAt: Date | null;
  sourceType: string;
} | null;
export type AcquisitionRecord = { id: string; status: string; result?: RawEvidence };

export interface EvidenceAcquisitionRepository {
  findByIdempotencyKey(key: string): Promise<AcquisitionRecord | null>;
  findValidEvidence(
    submissionId: string,
    providerId: string,
    evidenceType: string,
    now: Date,
  ): Promise<ExistingEvidence>;
  reserve(
    input: EvidenceRequest & { providerId: string; quote: EvidenceQuote },
    authorize: (applicationSpent: bigint, dailySpent: bigint) => Promise<AuthorizationResult>,
  ): Promise<{ ok: true; record: AcquisitionRecord } | { ok: false; code: string }>;
  markAuthorized(id: string, quote: EvidenceQuote): Promise<void>;
  markPaid(id: string, evidence: RawEvidence): Promise<void>;
  finalize(id: string, input: { evidence: RawEvidence; idempotencyKey: string }): Promise<void>;
  fail(id: string, failureCode: string, retryable: boolean): Promise<void>;
  writeAudit(input: {
    businessId: string;
    submissionId: string;
    action: string;
    metadata: Record<string, string>;
  }): Promise<void>;
}

export type AcquireEvidenceResult =
  | { ok: true; acquisitionId: string; providerCheck: RawEvidence; reused: boolean }
  | { ok: false; code: string };

export class EvidenceOrchestrator {
  constructor(
    private readonly provider: EvidenceProvider,
    private readonly repository: EvidenceAcquisitionRepository,
    private readonly paymentAuthorizer: PaymentAuthorizer,
  ) {}

  async acquire(input: EvidenceRequest): Promise<AcquireEvidenceResult> {
    if (!input.consentAt || !input.consentVersion) return { ok: false, code: 'CONSENT_REQUIRED' };
    if (!/^[a-f0-9]{64}$/i.test(input.requestHash))
      return { ok: false, code: 'INVALID_REQUEST_HASH' };
    if (
      !this.provider.supportedCountries.has(input.country) ||
      !this.provider.supportedEvidenceTypes.has(input.evidenceType)
    ) {
      return { ok: false, code: 'PROVIDER_SCOPE_UNSUPPORTED' };
    }

    const prior = await this.repository.findByIdempotencyKey(input.idempotencyKey);
    if (prior?.status === 'Fulfilled' && prior.result) {
      return { ok: true, acquisitionId: prior.id, providerCheck: prior.result, reused: true };
    }
    if (prior) return { ok: false, code: 'ACQUISITION_ALREADY_IN_PROGRESS' };

    const valid = await this.repository.findValidEvidence(
      input.submissionId,
      this.provider.id,
      input.evidenceType,
      input.now,
    );
    if (valid) return { ok: false, code: 'VALID_EVIDENCE_ALREADY_EXISTS' };

    const quote = await this.provider.quote(input);
    const reservation = await this.repository.reserve(
      { ...input, providerId: this.provider.id, quote },
      (applicationSpent, dailySpent) =>
        this.paymentAuthorizer.authorize({ quote, now: input.now, applicationSpent, dailySpent }),
    );
    if (!reservation.ok) return { ok: false, code: reservation.code };
    const acquisition = reservation.record;
    try {
      await this.repository.markAuthorized(acquisition.id, quote);
      const evidence = await this.provider.acquire(input, quote);
      if (!isValidEvidence(evidence, input, this.provider.id, quote)) {
        await this.repository.fail(acquisition.id, 'INVALID_PROVIDER_RESPONSE', false);
        await this.audit(input, 'EvidenceAcquisitionFailed', { code: 'INVALID_PROVIDER_RESPONSE' });
        return { ok: false, code: 'INVALID_PROVIDER_RESPONSE' };
      }
      await this.repository.markPaid(acquisition.id, evidence);
      await this.repository.finalize(acquisition.id, {
        evidence,
        idempotencyKey: input.idempotencyKey,
      });
      await this.audit(input, 'EvidenceAcquired', {
        providerId: this.provider.id,
        evidenceType: input.evidenceType,
        responseHash: evidence.responseHash,
      });
      return { ok: true, acquisitionId: acquisition.id, providerCheck: evidence, reused: false };
    } catch {
      await this.repository.fail(acquisition.id, 'PROVIDER_ACQUISITION_FAILED', true);
      await this.audit(input, 'EvidenceAcquisitionFailed', { code: 'PROVIDER_ACQUISITION_FAILED' });
      return { ok: false, code: 'PROVIDER_ACQUISITION_FAILED' };
    }
  }

  private audit(input: EvidenceRequest, action: string, metadata: Record<string, string>) {
    return this.repository.writeAudit({
      businessId: input.businessId,
      submissionId: input.submissionId,
      action,
      metadata,
    });
  }
}

function isValidEvidence(
  evidence: RawEvidence,
  input: EvidenceRequest,
  providerId: string,
  quote: EvidenceQuote,
) {
  return (
    evidence.providerId === providerId &&
    evidence.subject === input.subject &&
    evidence.checkType === input.evidenceType &&
    evidence.sourceType === 'synthetic' &&
    ['active', 'inactive', 'unknown'].includes(evidence.result) &&
    evidence.reasonCodes.length > 0 &&
    /^[a-f0-9]{64}$/i.test(evidence.responseHash) &&
    evidence.paymentTxHash.length > 0 &&
    evidence.checkedAt <= input.now &&
    evidence.expiresAt > input.now &&
    evidence.paidAmount === quote.amount
  );
}
