import { z } from 'zod';

/** Maximum credit reputation score. Mirrors `SCORE_MAX` in the contract. */
export const SCORE_MAX = 1000;

/** KYB lifecycle — mirrors SEP-12 customer statuses and the contract enum. */
export const KybStatus = {
  None: 'None',
  Processing: 'Processing',
  Accepted: 'Accepted',
  Rejected: 'Rejected',
} as const;
export type KybStatus = (typeof KybStatus)[keyof typeof KybStatus];
export const kybStatusSchema = z.nativeEnum(KybStatus);

/** Risk tier derived from the score. `A` best, `E` worst. */
export const RiskBand = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
} as const;
export type RiskBand = (typeof RiskBand)[keyof typeof RiskBand];
export const riskBandSchema = z.nativeEnum(RiskBand);

/**
 * Deterministic score -> risk band mapping. MUST match `band_for` in the
 * contract; kept here so the UI can preview bands without a chain round-trip.
 */
export function bandForScore(score: number): RiskBand {
  if (score >= 800) return RiskBand.A;
  if (score >= 650) return RiskBand.B;
  if (score >= 500) return RiskBand.C;
  if (score >= 350) return RiskBand.D;
  return RiskBand.E;
}

/**
 * Credit Reputation Score parameters (v1, fixed). MUST match
 * `packages/soroban/contracts/credit_score` and `docs/score-spec.md` — this
 * is the same formula the contract's `preview()` runs, kept here so the UI
 * can preview a gain without a chain round-trip.
 */
export const SCORE_BASE_GAIN = 40;
export const SCORE_STREAK_BONUS_PER = 5;
export const SCORE_STREAK_BONUS_MAX = 50;
export const SCORE_LATE_PENALTY = 30;
export const SCORE_DEFAULT_PENALTY = 150;

/** Points a business would gain from its *next* on-time, externally-funded repayment. */
export function previewOnTimeGain(current: number, streak: number): number {
  const headroom = SCORE_MAX - current;
  const streakBonus = Math.min(streak * SCORE_STREAK_BONUS_PER, SCORE_STREAK_BONUS_MAX);
  return Math.floor(((SCORE_BASE_GAIN + streakBonus) * headroom) / SCORE_MAX);
}

/** The on-chain Business Passport, decoded to JS. */
export const passportSchema = z.object({
  /** Stellar address that owns the Passport (the business identity key). */
  business: z.string(),
  kybStatus: kybStatusSchema,
  score: z.number().int().min(0).max(SCORE_MAX),
  riskBand: riskBandSchema,
  loansTotal: z.number().int().nonnegative(),
  loansRepaid: z.number().int().nonnegative(),
  onTimeStreak: z.number().int().nonnegative(),
  /** Unix seconds. */
  issuedAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  /** Hex-encoded 32-byte commitment to the off-chain KYB bundle. */
  dataHash: z.string(),
});
export type Passport = z.infer<typeof passportSchema>;
