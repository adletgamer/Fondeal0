import { z } from 'zod';
import { riskBandSchema, type RiskBand } from './passport';

/**
 * Reputation-adjusted partial collateralization (docs/product-v2.md §2).
 * A business posts a fraction of the loan principal as first-loss collateral;
 * that fraction shrinks as its credit score/band improves. This config is the
 * single source of truth for the ratios and suggested APRs — transparent and
 * governance-tunable, never a magic number inlined in a component.
 *
 * All money in this module is USDC **stroops** (1 USDC = 10_000_000 stroops,
 * see {@link USDC_STROOPS} in ./lending) represented as bigint-strings to
 * avoid floating-point precision loss. A parameter change here ships as a new
 * versioned config (see {@link COLLATERAL_CONFIG_V1}), same discipline as
 * docs/score-spec.md — never a silent tweak.
 */

/** Non-negative integer string — a USDC stroops amount that fits in a bigint. */
export const stroopsSchema = z
  .string()
  .regex(/^\d+$/, 'must be a non-negative integer string (USDC stroops)');

export interface CollateralConfig {
  /** Fraction of principal the business must post as first-loss collateral, in basis points. */
  collateralRatioBps: number;
  /** Suggested APR for opportunities in this band, in basis points. */
  suggestedAprBps: number;
}

export const collateralConfigSchema = z.object({
  collateralRatioBps: z.number().int().min(0).max(10_000),
  suggestedAprBps: z.number().int().min(0).max(10_000),
});

/**
 * v1 parameters, exactly matching docs/product-v2.md §2:
 * A 20%/12%, B 35%/16%, C 50%/20%, D 75%/26%, E 100%/32%.
 */
export const COLLATERAL_CONFIG_V1: Readonly<Record<RiskBand, CollateralConfig>> = {
  A: { collateralRatioBps: 2000, suggestedAprBps: 1200 },
  B: { collateralRatioBps: 3500, suggestedAprBps: 1600 },
  C: { collateralRatioBps: 5000, suggestedAprBps: 2000 },
  D: { collateralRatioBps: 7500, suggestedAprBps: 2600 },
  E: { collateralRatioBps: 10000, suggestedAprBps: 3200 },
};

export const collateralConfigByBandSchema = z.record(riskBandSchema, collateralConfigSchema);

const BPS_DENOMINATOR = 10_000n;

/**
 * Required first-loss collateral for a loan of `principal` stroops at `band`.
 * Pure integer math (bigint) — no floating point, no precision loss.
 */
export function requiredCollateral(principal: string, band: RiskBand): string {
  const p = BigInt(principal);
  const ratio = BigInt(COLLATERAL_CONFIG_V1[band].collateralRatioBps);
  return ((p * ratio) / BPS_DENOMINATOR).toString();
}

/**
 * The percentage of investor loss the collateral covers first (0-100) — the
 * "max protected %" disclosed per opportunity (docs/product-v2.md §2/§3).
 * Numerically identical to the collateral ratio: collateral covers exactly
 * that fraction of principal, so it covers that same fraction of loss.
 */
export function maxProtectedPct(band: RiskBand): number {
  return COLLATERAL_CONFIG_V1[band].collateralRatioBps / 100;
}

export interface RepaymentInstallment {
  /** 1-based installment number. */
  index: number;
  /** Days from loan start this installment is due. */
  dueInDays: number;
  /** Principal portion, USDC stroops. */
  principal: string;
  /** Interest portion, USDC stroops. */
  interest: string;
  /** principal + interest, USDC stroops. */
  total: string;
}

export const repaymentInstallmentSchema = z.object({
  index: z.number().int().positive(),
  dueInDays: z.number().int().nonnegative(),
  principal: stroopsSchema,
  interest: stroopsSchema,
  total: stroopsSchema,
});

export const repaymentScheduleSchema = z.array(repaymentInstallmentSchema);

const DAYS_PER_YEAR = 365n;

/**
 * A simple, transparent amortization schedule: interest accrues once over the
 * full term at a flat simple-interest rate (`principal * aprBps/10000 *
 * termDays/365`), and both principal and interest are split into equal
 * installments due at evenly-spaced intervals. Integer division means the
 * final installment absorbs any remainder, so the schedule always sums back
 * to exactly principal + totalInterest — never off by a stroop from rounding.
 */
export function buildRepaymentSchedule(
  principal: string,
  aprBps: number,
  termDays: number,
  installments: number,
): RepaymentInstallment[] {
  if (installments < 1 || !Number.isInteger(installments)) {
    throw new Error('buildRepaymentSchedule: installments must be a positive integer');
  }
  if (termDays < 1 || !Number.isInteger(termDays)) {
    throw new Error('buildRepaymentSchedule: termDays must be a positive integer');
  }

  const p = BigInt(principal);
  const apr = BigInt(aprBps);
  const term = BigInt(termDays);
  const n = BigInt(installments);

  const totalInterest = (p * apr * term) / (BPS_DENOMINATOR * DAYS_PER_YEAR);

  const basePrincipalShare = p / n;
  const baseInterestShare = totalInterest / n;

  const schedule: RepaymentInstallment[] = [];
  let principalPaid = 0n;
  let interestPaid = 0n;

  for (let i = 1n; i <= n; i++) {
    const isLast = i === n;
    const principalShare = isLast ? p - principalPaid : basePrincipalShare;
    const interestShare = isLast ? totalInterest - interestPaid : baseInterestShare;
    principalPaid += principalShare;
    interestPaid += interestShare;

    schedule.push({
      index: Number(i),
      dueInDays: Number((i * term) / n),
      principal: principalShare.toString(),
      interest: interestShare.toString(),
      total: (principalShare + interestShare).toString(),
    });
  }

  return schedule;
}
