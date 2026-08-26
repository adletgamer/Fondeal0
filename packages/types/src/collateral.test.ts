import { describe, expect, it } from 'vitest';
import {
  COLLATERAL_CONFIG_V1,
  buildRepaymentSchedule,
  collateralConfigByBandSchema,
  collateralConfigSchema,
  maxProtectedPct,
  repaymentScheduleSchema,
  requiredCollateral,
  stroopsSchema,
} from './collateral';
import { RiskBand } from './passport';

describe('COLLATERAL_CONFIG_V1', () => {
  it('matches docs/product-v2.md §2 exactly', () => {
    expect(COLLATERAL_CONFIG_V1).toEqual({
      A: { collateralRatioBps: 2000, suggestedAprBps: 1200 },
      B: { collateralRatioBps: 3500, suggestedAprBps: 1600 },
      C: { collateralRatioBps: 5000, suggestedAprBps: 2000 },
      D: { collateralRatioBps: 7500, suggestedAprBps: 2600 },
      E: { collateralRatioBps: 10000, suggestedAprBps: 3200 },
    });
  });

  it('validates against the zod schema for every band', () => {
    expect(collateralConfigByBandSchema.parse(COLLATERAL_CONFIG_V1)).toBeTruthy();
    for (const band of Object.values(RiskBand)) {
      expect(collateralConfigSchema.parse(COLLATERAL_CONFIG_V1[band])).toBeTruthy();
    }
  });
});

describe('requiredCollateral', () => {
  it('computes 20% for band A on a round principal', () => {
    // 100 USDC at 7 decimals = 1_000_000_000 stroops.
    expect(requiredCollateral('1000000000', RiskBand.A)).toBe('200000000');
  });

  it('computes 100% for band E — collateral equals principal', () => {
    expect(requiredCollateral('1000000000', RiskBand.E)).toBe(String(1_000_000_000));
  });

  it('computes 50% for band C', () => {
    expect(requiredCollateral('1000000000', RiskBand.C)).toBe('500000000');
  });

  it('truncates toward zero on non-exact division, never rounds up', () => {
    // 7 stroops * 50% = 3.5 -> must truncate to 3, not round to 4.
    expect(requiredCollateral('7', RiskBand.C)).toBe('3');
  });

  it('returns "0" for a zero principal', () => {
    expect(requiredCollateral('0', RiskBand.B)).toBe('0');
  });
});

describe('maxProtectedPct', () => {
  it('matches the collateral ratio expressed as a percentage per band', () => {
    expect(maxProtectedPct(RiskBand.A)).toBe(20);
    expect(maxProtectedPct(RiskBand.B)).toBe(35);
    expect(maxProtectedPct(RiskBand.C)).toBe(50);
    expect(maxProtectedPct(RiskBand.D)).toBe(75);
    expect(maxProtectedPct(RiskBand.E)).toBe(100);
  });
});

describe('buildRepaymentSchedule', () => {
  it('splits principal and interest evenly when it divides exactly', () => {
    // 100 USDC, 10% APR, 365-day term, 4 installments -> totalInterest = 10 USDC exactly.
    const schedule = buildRepaymentSchedule('1000000000', 1000, 365, 4);

    expect(schedule).toHaveLength(4);
    expect(schedule.map((s) => s.principal)).toEqual([
      '250000000',
      '250000000',
      '250000000',
      '250000000',
    ]);
    expect(schedule.map((s) => s.interest)).toEqual([
      '25000000',
      '25000000',
      '25000000',
      '25000000',
    ]);
    expect(schedule.map((s) => s.total)).toEqual([
      '275000000',
      '275000000',
      '275000000',
      '275000000',
    ]);
    expect(schedule.map((s) => s.dueInDays)).toEqual([91, 182, 273, 365]);
    expect(schedule.map((s) => s.index)).toEqual([1, 2, 3, 4]);
  });

  it('never loses a stroop to rounding — the final installment absorbs the remainder', () => {
    const schedule = buildRepaymentSchedule('10', 0, 30, 3);

    expect(schedule.map((s) => s.principal)).toEqual(['3', '3', '4']);
    const totalPrincipal = schedule.reduce((sum, s) => sum + BigInt(s.principal), 0n);
    expect(totalPrincipal).toBe(10n);
  });

  it('produces zero interest at 0 APR', () => {
    const schedule = buildRepaymentSchedule('9000000', 0, 90, 3);
    for (const installment of schedule) {
      expect(installment.interest).toBe('0');
      expect(installment.total).toBe(installment.principal);
    }
  });

  it('always sums back to exactly principal + total interest, whatever the split', () => {
    const principal = '123456789';
    const aprBps = 1800;
    const termDays = 97;
    const installments = 6;
    const schedule = buildRepaymentSchedule(principal, aprBps, termDays, installments);

    const totalPrincipal = schedule.reduce((sum, s) => sum + BigInt(s.principal), 0n);
    const totalInterest = schedule.reduce((sum, s) => sum + BigInt(s.interest), 0n);
    expect(totalPrincipal).toBe(BigInt(principal));
    expect(totalInterest).toBe(
      (BigInt(principal) * BigInt(aprBps) * BigInt(termDays)) / (10_000n * 365n),
    );

    expect(repaymentScheduleSchema.parse(schedule)).toBeTruthy();
  });

  it('rejects a non-positive or non-integer installment count', () => {
    expect(() => buildRepaymentSchedule('1000', 1000, 30, 0)).toThrow();
    expect(() => buildRepaymentSchedule('1000', 1000, 30, -1)).toThrow();
    expect(() => buildRepaymentSchedule('1000', 1000, 30, 1.5)).toThrow();
  });

  it('rejects a non-positive or non-integer term', () => {
    expect(() => buildRepaymentSchedule('1000', 1000, 0, 3)).toThrow();
    expect(() => buildRepaymentSchedule('1000', 1000, -30, 3)).toThrow();
    expect(() => buildRepaymentSchedule('1000', 1000, 30.5, 3)).toThrow();
  });
});

describe('stroopsSchema', () => {
  it('accepts non-negative integer strings', () => {
    expect(stroopsSchema.parse('0')).toBe('0');
    expect(stroopsSchema.parse('123456789')).toBe('123456789');
  });

  it('rejects negatives, decimals, and non-numeric strings', () => {
    expect(stroopsSchema.safeParse('-1').success).toBe(false);
    expect(stroopsSchema.safeParse('1.5').success).toBe(false);
    expect(stroopsSchema.safeParse('abc').success).toBe(false);
    expect(stroopsSchema.safeParse('').success).toBe(false);
  });
});
