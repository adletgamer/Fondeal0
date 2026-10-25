export const STELLAR_TESTNET = 'stellar:testnet';
export const TESTNET_USDC_CONTRACT = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

export type EvidenceQuote = {
  providerId: string;
  country: string;
  evidenceType: string;
  network: string;
  asset: string;
  payTo: string;
  amount: string;
  expiresAt: Date;
};

export type SpendingRequest = {
  quote: EvidenceQuote;
  now: Date;
  applicationSpent: bigint;
  dailySpent: bigint;
};

export type SpendingLimits = {
  allowedProviders: ReadonlySet<string>;
  allowedCountries: ReadonlySet<string>;
  allowedEvidenceTypes: ReadonlySet<string>;
  allowedRecipients: ReadonlySet<string>;
  maxPerCall: bigint;
  maxPerApplication: bigint;
  maxPerDay: bigint;
};

export type AuthorizationResult =
  { allowed: true; amountBaseUnits: bigint } | { allowed: false; reason: string };

/** Parse an x402 Stellar token amount (7 decimal places) without floating-point rounding. */
export function usdcToBaseUnits(amount: string): bigint | null {
  if (!/^(0|[1-9]\d{0,7})(\.\d{1,7})?$/.test(amount)) return null;
  const [whole = '0', fraction = ''] = amount.split('.');
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, '0'));
}

export function authorizeEvidenceSpend(
  request: SpendingRequest,
  limits: SpendingLimits,
): AuthorizationResult {
  const { quote, now, applicationSpent, dailySpent } = request;
  const amount = usdcToBaseUnits(quote.amount);
  if (!limits.allowedProviders.has(quote.providerId))
    return { allowed: false, reason: 'PROVIDER_NOT_ALLOWED' };
  if (
    !limits.allowedCountries.has(quote.country) ||
    !limits.allowedEvidenceTypes.has(quote.evidenceType)
  ) {
    return { allowed: false, reason: 'EVIDENCE_SCOPE_NOT_ALLOWED' };
  }
  if (quote.network !== STELLAR_TESTNET) return { allowed: false, reason: 'NETWORK_NOT_ALLOWED' };
  if (quote.asset !== TESTNET_USDC_CONTRACT) return { allowed: false, reason: 'ASSET_NOT_ALLOWED' };
  if (!limits.allowedRecipients.has(quote.payTo))
    return { allowed: false, reason: 'RECIPIENT_NOT_ALLOWED' };
  if (!amount || amount <= 0n) return { allowed: false, reason: 'INVALID_QUOTE_AMOUNT' };
  if (quote.expiresAt <= now) return { allowed: false, reason: 'QUOTE_EXPIRED' };
  if (amount > limits.maxPerCall) return { allowed: false, reason: 'PER_CALL_LIMIT_EXCEEDED' };
  if (applicationSpent + amount > limits.maxPerApplication)
    return { allowed: false, reason: 'APPLICATION_BUDGET_EXCEEDED' };
  if (dailySpent + amount > limits.maxPerDay)
    return { allowed: false, reason: 'DAILY_BUDGET_EXCEEDED' };
  return { allowed: true, amountBaseUnits: amount };
}

export interface PaymentAuthorizer {
  authorize(request: SpendingRequest): Promise<AuthorizationResult>;
}

/** Deterministic server guard; wallet and Smart Account implementations can replace it behind this interface. */
export class ServerPolicyAuthorizer implements PaymentAuthorizer {
  constructor(private readonly limits: SpendingLimits) {}
  async authorize(request: SpendingRequest) {
    return authorizeEvidenceSpend(request, this.limits);
  }
}
