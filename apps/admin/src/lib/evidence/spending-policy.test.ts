import { describe, expect, it } from 'vitest';
import {
  authorizeEvidenceSpend,
  STELLAR_TESTNET,
  TESTNET_USDC_CONTRACT,
  usdcToBaseUnits,
  type EvidenceQuote,
  type SpendingLimits,
} from './spending-policy';

const limits: SpendingLimits = {
  allowedProviders: new Set(['synthetic-registry-pe']),
  allowedCountries: new Set(['PE']),
  allowedEvidenceTypes: new Set(['ENTITY_STATUS']),
  allowedRecipients: new Set(['G'.padEnd(56, 'A')]),
  maxPerCall: 200_000n,
  maxPerApplication: 500_000n,
  maxPerDay: 1_000_000n,
};

const quote: EvidenceQuote = {
  providerId: 'synthetic-registry-pe',
  country: 'PE',
  evidenceType: 'ENTITY_STATUS',
  network: STELLAR_TESTNET,
  asset: TESTNET_USDC_CONTRACT,
  payTo: 'G'.padEnd(56, 'A'),
  amount: '0.02',
  expiresAt: new Date('2026-10-25T12:01:00Z'),
};

describe('bounded x402 spending policy', () => {
  it('parses exact token base units without floats', () => {
    expect(usdcToBaseUnits('0.0000001')).toBe(1n);
    expect(usdcToBaseUnits('0.02')).toBe(200_000n);
    expect(usdcToBaseUnits('0.00000001')).toBeNull();
    expect(usdcToBaseUnits('1e-3')).toBeNull();
  });

  it('allows an exact allowlisted Testnet USDC quote under caps', () => {
    expect(
      authorizeEvidenceSpend(
        { quote, now: new Date('2026-10-25T12:00:00Z'), applicationSpent: 0n, dailySpent: 0n },
        limits,
      ),
    ).toEqual({ allowed: true, amountBaseUnits: 200_000n });
  });

  it.each([
    [{ ...quote, providerId: 'unknown' }, 'PROVIDER_NOT_ALLOWED'],
    [{ ...quote, country: 'CL' }, 'EVIDENCE_SCOPE_NOT_ALLOWED'],
    [{ ...quote, evidenceType: 'ACCOUNT_OWNERSHIP' }, 'EVIDENCE_SCOPE_NOT_ALLOWED'],
    [{ ...quote, network: 'stellar:pubnet' }, 'NETWORK_NOT_ALLOWED'],
    [
      { ...quote, asset: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75' },
      'ASSET_NOT_ALLOWED',
    ],
    [{ ...quote, payTo: 'G'.padEnd(55, 'A') }, 'RECIPIENT_NOT_ALLOWED'],
    [{ ...quote, amount: '0.0200001' }, 'PER_CALL_LIMIT_EXCEEDED'],
    [{ ...quote, amount: '0.01' }, 'APPLICATION_BUDGET_EXCEEDED'],
    [{ ...quote, amount: '0.01' }, 'DAILY_BUDGET_EXCEEDED'],
    [{ ...quote, amount: '0' }, 'INVALID_QUOTE_AMOUNT'],
    [{ ...quote, expiresAt: new Date('2026-10-25T11:59:59Z') }, 'QUOTE_EXPIRED'],
  ])('rejects unsafe quote terms', (candidate, expected) => {
    const applicationSpent = expected === 'APPLICATION_BUDGET_EXCEEDED' ? 500_000n : 0n;
    const dailySpent = expected === 'DAILY_BUDGET_EXCEEDED' ? 1_000_000n : 0n;
    const result = authorizeEvidenceSpend(
      {
        quote: candidate as EvidenceQuote,
        now: new Date('2026-10-25T12:00:00Z'),
        applicationSpent,
        dailySpent,
      },
      limits,
    );
    expect(result).toEqual({ allowed: false, reason: expected });
  });
});
