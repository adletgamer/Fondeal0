import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EvidenceOrchestrator,
  type EvidenceAcquisitionRepository,
  type EvidenceProvider,
  type EvidenceRequest,
  type RawEvidence,
} from './orchestrator';
import {
  ServerPolicyAuthorizer,
  STELLAR_TESTNET,
  TESTNET_USDC_CONTRACT,
  type EvidenceQuote,
} from './spending-policy';

const now = new Date('2026-10-25T12:00:00Z');
const request: EvidenceRequest = {
  businessId: 'business-demo',
  submissionId: 'submission-demo',
  country: 'PE',
  subject: 'PE:20123456789',
  evidenceType: 'ENTITY_STATUS',
  consentAt: now,
  consentVersion: 'demo-consent-v1',
  idempotencyKey: 'acq-demo-001',
  requestHash: 'a'.repeat(64),
  now,
};
const quote: EvidenceQuote = {
  providerId: 'synthetic-registry-pe',
  country: 'PE',
  evidenceType: 'ENTITY_STATUS',
  network: STELLAR_TESTNET,
  asset: TESTNET_USDC_CONTRACT,
  payTo: 'G'.padEnd(56, 'A'),
  amount: '0.02',
  expiresAt: new Date(now.getTime() + 30_000),
};
const evidence: RawEvidence = {
  providerId: 'synthetic-registry-pe',
  checkType: 'ENTITY_STATUS',
  subject: request.subject,
  result: 'active',
  sourceType: 'synthetic',
  checkedAt: now,
  expiresAt: new Date(now.getTime() + 86_400_000),
  reasonCodes: ['ENTITY_ACTIVE'],
  responseHash: 'b'.repeat(64),
  paymentTxHash: 'testnet-tx-hash',
  paidAmount: '0.02',
};

const provider: EvidenceProvider = {
  id: 'synthetic-registry-pe',
  supportedCountries: new Set(['PE']),
  supportedEvidenceTypes: new Set(['ENTITY_STATUS']),
  quote: vi.fn(async () => quote),
  acquire: vi.fn(async () => evidence),
};
const limits = {
  allowedProviders: new Set(['synthetic-registry-pe']),
  allowedCountries: new Set(['PE']),
  allowedEvidenceTypes: new Set(['ENTITY_STATUS']),
  allowedRecipients: new Set([quote.payTo]),
  maxPerCall: 200_000n,
  maxPerApplication: 500_000n,
  maxPerDay: 1_000_000n,
};
let repository: EvidenceAcquisitionRepository;
let calls: Record<string, ReturnType<typeof vi.fn>>;

function makeOrchestrator() {
  calls = {
    findByIdempotencyKey: vi.fn(async () => null),
    findValidEvidence: vi.fn(async () => null),
    reserve: vi.fn(async (_input, authorize) => {
      const result = await authorize(0n, 0n);
      return result.allowed
        ? { ok: true as const, record: { id: 'acq-1', status: 'Authorized' } }
        : { ok: false as const, code: result.reason };
    }),
    markAuthorized: vi.fn(async () => {}),
    markPaid: vi.fn(async () => {}),
    finalize: vi.fn(async () => {}),
    fail: vi.fn(async () => {}),
    writeAudit: vi.fn(async () => {}),
  };
  repository = calls as unknown as EvidenceAcquisitionRepository;
  return new EvidenceOrchestrator(provider, repository, new ServerPolicyAuthorizer(limits));
}

describe('evidence acquisition orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails closed without consent and does not quote or spend', async () => {
    const flow = makeOrchestrator();
    const result = await flow.acquire({ ...request, consentAt: null });
    expect(result).toEqual({ ok: false, code: 'CONSENT_REQUIRED' });
    expect(provider.quote).not.toHaveBeenCalled();
    expect(calls.reserve).not.toHaveBeenCalled();
  });

  it('does not buy evidence that is already fresh', async () => {
    const flow = makeOrchestrator();
    calls.findValidEvidence!.mockResolvedValue({
      result: 'active',
      expiresAt: evidence.expiresAt,
      sourceType: 'synthetic',
    });
    const result = await flow.acquire(request);
    expect(result).toEqual({ ok: false, code: 'VALID_EVIDENCE_ALREADY_EXISTS' });
    expect(provider.quote).not.toHaveBeenCalled();
  });

  it('reserves budget, verifies synthetic response, and finalizes without an underwriting decision', async () => {
    const result = await makeOrchestrator().acquire(request);
    expect(result).toEqual({
      ok: true,
      acquisitionId: 'acq-1',
      providerCheck: evidence,
      reused: false,
    });
    expect(calls.markAuthorized).toHaveBeenCalledOnce();
    expect(calls.markPaid).toHaveBeenCalledOnce();
    expect(calls.finalize).toHaveBeenCalledOnce();
    expect(calls.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'EvidenceAcquired' }),
    );
  });

  it('rejects an unauthorized quote before creating an acquisition', async () => {
    vi.mocked(provider.quote).mockResolvedValueOnce({ ...quote, network: 'stellar:pubnet' });
    const result = await makeOrchestrator().acquire(request);
    expect(result).toEqual({ ok: false, code: 'NETWORK_NOT_ALLOWED' });
    expect(calls.reserve).toHaveBeenCalledOnce();
    expect(provider.acquire).not.toHaveBeenCalled();
  });

  it('records malformed provider output as a failed acquisition, never as a ProviderCheck', async () => {
    vi.mocked(provider.acquire).mockResolvedValueOnce({ ...evidence, subject: 'PE:99999999999' });
    const result = await makeOrchestrator().acquire(request);
    expect(result).toEqual({ ok: false, code: 'INVALID_PROVIDER_RESPONSE' });
    expect(calls.fail).toHaveBeenCalledWith('acq-1', 'INVALID_PROVIDER_RESPONSE', false);
    expect(calls.finalize).not.toHaveBeenCalled();
  });

  it('returns a completed idempotent acquisition without repurchasing', async () => {
    const flow = makeOrchestrator();
    calls.findByIdempotencyKey!.mockResolvedValue({
      id: 'acq-old',
      status: 'Fulfilled',
      result: evidence,
    });
    const result = await flow.acquire(request);
    expect(result).toEqual({
      ok: true,
      acquisitionId: 'acq-old',
      providerCheck: evidence,
      reused: true,
    });
    expect(provider.quote).not.toHaveBeenCalled();
    expect(provider.acquire).not.toHaveBeenCalled();
  });
});
