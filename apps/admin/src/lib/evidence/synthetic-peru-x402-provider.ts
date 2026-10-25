import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';
import { x402Client, x402HTTPClient } from '@x402/fetch';
import type { PaymentRequired } from '@x402/fetch';
import { createEd25519Signer } from '@x402/stellar';
import { ExactStellarScheme } from '@x402/stellar/exact/client';
import { STELLAR_TESTNET, TESTNET_USDC_CONTRACT, type EvidenceQuote } from './spending-policy';
import type { EvidenceProvider, EvidenceRequest, RawEvidence } from './orchestrator';

export const SYNTHETIC_PROVIDER_ID = 'synthetic-registry-pe';
export const SYNTHETIC_SUBJECT = 'PE:20123456789';
const MAX_QUOTE_AGE_MS = 30_000;

type ProviderConfig = {
  endpoint: string;
  allowedOrigins: ReadonlySet<string>;
  signerSecret?: string;
  responsePublicKey?: string;
  enabled: boolean;
  now?: () => Date;
};

type UnpaidQuote = { required: PaymentRequired; requirement: PaymentRequired['accepts'][number] };

/** Single synthetic Peru registry x402 adapter. No government endpoint is contacted. */
export class SyntheticPeruRegistryProvider implements EvidenceProvider {
  readonly id = SYNTHETIC_PROVIDER_ID;
  readonly supportedCountries = new Set(['PE']);
  readonly supportedEvidenceTypes = new Set(['ENTITY_STATUS']);
  private readonly endpoint: URL;
  private readonly now: () => Date;

  constructor(private readonly config: ProviderConfig) {
    this.endpoint = new URL(config.endpoint);
    this.now = config.now ?? (() => new Date());
    if (!config.allowedOrigins.has(this.endpoint.origin))
      throw new Error('PROVIDER_ORIGIN_NOT_ALLOWED');
    if (decodeURIComponent(this.endpoint.pathname) !== `/verify/entity/${SYNTHETIC_SUBJECT}`)
      throw new Error('ONLY_FIXED_SYNTHETIC_ENDPOINT_ALLOWED');
    if (
      this.endpoint.protocol !== 'https:' &&
      this.endpoint.hostname !== '127.0.0.1' &&
      this.endpoint.hostname !== 'localhost'
    ) {
      throw new Error('PROVIDER_TRANSPORT_MUST_BE_HTTPS');
    }
  }

  async quote(input: EvidenceRequest): Promise<EvidenceQuote> {
    assertSyntheticRequest(input);
    const { requirement } = await this.getUnpaidQuote();
    return {
      providerId: this.id,
      country: input.country,
      evidenceType: input.evidenceType,
      network: requirement.network,
      asset: requirement.asset,
      payTo: requirement.payTo,
      amount: baseUnitsToDecimal(requirement.amount),
      expiresAt: new Date(this.now().getTime() + MAX_QUOTE_AGE_MS),
    };
  }

  async acquire(input: EvidenceRequest, quote: EvidenceQuote): Promise<RawEvidence> {
    assertSyntheticRequest(input);
    if (!this.config.enabled || !this.config.signerSecret || !this.config.responsePublicKey)
      throw new Error('X402_TESTNET_BUYER_DISABLED');

    // Re-fetch and compare the quote immediately before signing, so changed terms fail closed.
    const unpaid = await this.getUnpaidQuote();
    if (!sameQuote(unpaid.requirement, quote)) throw new Error('X402_QUOTE_CHANGED');
    if (quote.expiresAt <= this.now()) throw new Error('X402_QUOTE_EXPIRED');

    const signer = createEd25519Signer(this.config.signerSecret, STELLAR_TESTNET);
    const client = new x402Client().register(
      'stellar:*',
      new ExactStellarScheme(signer, {
        url: 'https://soroban-testnet.stellar.org',
      }),
    );
    const http = new x402HTTPClient(client);
    const paymentPayload = await client.createPaymentPayload(unpaid.required);
    const response = await fetch(this.endpoint, {
      method: 'GET',
      headers: http.encodePaymentSignatureHeader(paymentPayload),
      cache: 'no-store',
      redirect: 'error',
    });
    const settlement = http.getPaymentSettleResponse((name) => response.headers.get(name));
    if (
      !response.ok ||
      !settlement.success ||
      settlement.network !== STELLAR_TESTNET ||
      !settlement.transaction ||
      (settlement.amount !== undefined && settlement.amount !== unpaid.requirement.amount)
    ) {
      throw new Error('X402_SETTLEMENT_NOT_CONFIRMED');
    }

    const raw = await response.text();
    const data: unknown = JSON.parse(raw);
    const normalized = normalizeSyntheticResponse(
      data,
      input,
      this.now(),
      this.config.responsePublicKey,
    );
    return {
      ...normalized,
      responseHash: createHash('sha256').update(raw, 'utf8').digest('hex'),
      paymentTxHash: settlement.transaction,
      paidAmount: quote.amount,
    };
  }

  private async getUnpaidQuote(): Promise<UnpaidQuote> {
    const response = await fetch(this.endpoint, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'error',
    });
    if (response.status !== 402) throw new Error('EXPECTED_X402_PAYMENT_REQUIRED');
    const required = new x402HTTPClient(new x402Client()).getPaymentRequiredResponse((name) =>
      response.headers.get(name),
    );
    if (required.x402Version !== 2) throw new Error('UNSUPPORTED_X402_VERSION');
    const matching = required.accepts.filter(
      (item) =>
        item.scheme === 'exact' &&
        item.network === STELLAR_TESTNET &&
        item.asset === TESTNET_USDC_CONTRACT,
    );
    if (matching.length !== 1) throw new Error('X402_QUOTE_NOT_UNIQUE_OR_UNSUPPORTED');
    const requirement = matching[0];
    if (!requirement) throw new Error('X402_QUOTE_NOT_UNIQUE_OR_UNSUPPORTED');
    return { required: { ...required, accepts: [requirement] }, requirement };
  }
}

function assertSyntheticRequest(input: EvidenceRequest) {
  if (
    input.country !== 'PE' ||
    input.evidenceType !== 'ENTITY_STATUS' ||
    input.subject !== SYNTHETIC_SUBJECT
  ) {
    throw new Error('ONLY_FIXED_SYNTHETIC_CASE_ALLOWED');
  }
}

function sameQuote(requirement: PaymentRequired['accepts'][number], quote: EvidenceQuote) {
  return (
    requirement.scheme === 'exact' &&
    requirement.network === quote.network &&
    requirement.asset === quote.asset &&
    requirement.payTo === quote.payTo &&
    baseUnitsToDecimal(requirement.amount) === quote.amount &&
    quote.providerId === SYNTHETIC_PROVIDER_ID
  );
}

function baseUnitsToDecimal(amount: string): string {
  if (!/^(0|[1-9]\d{0,15})$/.test(amount)) throw new Error('INVALID_X402_AMOUNT');
  const units = BigInt(amount);
  const whole = units / 10_000_000n;
  const fraction = (units % 10_000_000n).toString().padStart(7, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function normalizeSyntheticResponse(
  value: unknown,
  request: EvidenceRequest,
  now: Date,
  publicKey: string,
): Omit<RawEvidence, 'responseHash' | 'paymentTxHash' | 'paidAmount'> {
  if (!value || typeof value !== 'object') throw new Error('MALFORMED_SYNTHETIC_RESPONSE');
  const item = value as Record<string, unknown>;
  if (
    item.providerId !== SYNTHETIC_PROVIDER_ID ||
    item.checkType !== 'entity_status' ||
    item.subject !== request.subject ||
    !['active', 'inactive', 'unknown'].includes(String(item.result)) ||
    item.sourceType !== 'synthetic' ||
    !Array.isArray(item.reasonCodes) ||
    typeof item.signature !== 'string' ||
    item.reasonCodes.length === 0 ||
    item.reasonCodes.length > 10 ||
    !item.reasonCodes.every((code) => typeof code === 'string' && /^[A-Z0-9_]{1,48}$/.test(code))
  ) {
    throw new Error('MALFORMED_SYNTHETIC_RESPONSE');
  }
  const { signature, ...signedBody } = item;
  if (!verifySyntheticResponseSignature(signedBody, signature, publicKey))
    throw new Error('INVALID_PROVIDER_SIGNATURE');
  const checkedAt = new Date(String(item.checkedAt));
  const expiresAt = new Date(String(item.expiresAt));
  if (
    !Number.isFinite(checkedAt.getTime()) ||
    !Number.isFinite(expiresAt.getTime()) ||
    checkedAt > now ||
    expiresAt <= now
  )
    throw new Error('STALE_SYNTHETIC_RESPONSE');
  return {
    providerId: SYNTHETIC_PROVIDER_ID,
    checkType: 'ENTITY_STATUS',
    subject: request.subject,
    result: item.result as RawEvidence['result'],
    sourceType: 'synthetic',
    checkedAt,
    expiresAt,
    reasonCodes: item.reasonCodes as string[],
  };
}

/** Synthetic provider signs the canonical JSON body without its signature field using Ed25519. */
export function verifySyntheticResponseSignature(
  body: Record<string, unknown>,
  signature: string,
  publicKeyPem: string,
): boolean {
  try {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) return false;
    const canonicalBody = canonicalize(body);
    return verifySignature(
      null,
      Buffer.from(canonicalBody, 'utf8'),
      createPublicKey(publicKeyPem),
      Buffer.from(signature, 'base64'),
    );
  } catch {
    return false;
  }
}

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
