import { describe, expect, it } from 'vitest';
import { COLLATERAL_CONFIG_V1, buildRepaymentSchedule, requiredCollateral } from './collateral';
import {
  RiskBand,
  SCORE_BASE_GAIN,
  SCORE_DEFAULT_PENALTY,
  SCORE_LATE_PENALTY,
  SCORE_MAX,
  SCORE_STREAK_BONUS_MAX,
  SCORE_STREAK_BONUS_PER,
  bandForScore,
  previewOnTimeGain,
} from './passport';

/**
 * TS <-> Rust parity (SA1 P0-1).
 *
 * The TypeScript money logic in this package and the Rust money logic in
 * `packages/soroban/contracts` implement the same formulas twice. Until now
 * the only thing keeping them in step was a "MUST match" comment in each file.
 * A silent drift means the app quotes a business one debt and the escrow
 * enforces another, which is the worst class of bug this product can ship.
 *
 * So the Rust side is transcribed here as golden constants and golden
 * reimplementations, each tagged with the file and line it came from. These are
 * deliberately hand-written duplicates: if either implementation moves, this
 * file fails and somebody has to decide which one was right.
 *
 * Verified against commit b7a8f49.
 */

// --- Rust, transcribed -----------------------------------------------------

/** `collateral_ratio_bps` — loan_escrow/src/types.rs:7-15 */
const RUST_COLLATERAL_RATIO_BPS: Record<RiskBand, bigint> = {
  A: 2000n,
  B: 3500n,
  C: 5000n,
  D: 7500n,
  E: 10000n,
};

/** `required_collateral` — loan_escrow/src/lib.rs:408-410 (i128, truncating) */
function rustRequiredCollateral(principal: bigint, band: RiskBand): bigint {
  return (principal * RUST_COLLATERAL_RATIO_BPS[band]) / 10_000n;
}

/** `total_due` — loan_escrow/src/lib.rs:414-417 (i128, truncating) */
function rustTotalDue(principal: bigint, aprBps: bigint, termDays: bigint): bigint {
  const interest = (principal * aprBps * termDays) / (10_000n * 365n);
  return principal + interest;
}

/** `band_for` — business_passport/src/lib.rs:573-581 */
function rustBandFor(score: number): RiskBand {
  if (score >= 800 && score <= 1000) return RiskBand.A;
  if (score >= 650 && score <= 799) return RiskBand.B;
  if (score >= 500 && score <= 649) return RiskBand.C;
  if (score >= 350 && score <= 499) return RiskBand.D;
  return RiskBand.E;
}

/** `next_score`, on-time branch — credit_score/src/lib.rs:201-215 (u32, truncating) */
function rustOnTimeGain(current: number, streak: number): number {
  const headroom = SCORE_MAX - current;
  const streakBonus = Math.min(streak * 5, 50);
  return Math.floor(((40 + streakBonus) * headroom) / 1000);
}

// --- Parity ----------------------------------------------------------------

describe('collateral ratios match the escrow contract', () => {
  it('has the same table as collateral_ratio_bps', () => {
    for (const band of Object.values(RiskBand)) {
      expect(BigInt(COLLATERAL_CONFIG_V1[band].collateralRatioBps)).toBe(
        RUST_COLLATERAL_RATIO_BPS[band],
      );
    }
  });

  it('covers every band, so a new band cannot be added on one side only', () => {
    expect(Object.keys(COLLATERAL_CONFIG_V1).sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(Object.keys(RUST_COLLATERAL_RATIO_BPS).sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});

describe('requiredCollateral matches required_collateral', () => {
  // Awkward values on purpose: each one truncates, which is where two
  // implementations of "the same" formula usually diverge.
  const principals = [
    '0',
    '1',
    '3',
    '7',
    '99',
    '101',
    '12345',
    '999999',
    '1000000',
    '50000000', // 5 USDC in stroops
    '123456789',
    '9007199254740993', // > Number.MAX_SAFE_INTEGER: bigint-only territory
  ];

  it.each(principals)('agrees for principal %s across every band', (principal) => {
    for (const band of Object.values(RiskBand)) {
      expect(requiredCollateral(principal, band)).toBe(
        rustRequiredCollateral(BigInt(principal), band).toString(),
      );
    }
  });

  it('truncates rather than rounds, exactly as i128 division does', () => {
    // 3 * 3500 / 10000 = 1.05 -> 1 on both sides
    expect(requiredCollateral('3', RiskBand.B)).toBe('1');
    expect(rustRequiredCollateral(3n, RiskBand.B)).toBe(1n);
  });
});

describe('buildRepaymentSchedule total matches total_due', () => {
  const cases: Array<{
    principal: string;
    aprBps: number;
    termDays: number;
    installments: number;
  }> = [
    { principal: '1000', aprBps: 2000, termDays: 90, installments: 3 },
    { principal: '5000', aprBps: 1600, termDays: 180, installments: 6 },
    { principal: '12345', aprBps: 3200, termDays: 365, installments: 12 },
    { principal: '1', aprBps: 1200, termDays: 30, installments: 1 },
    { principal: '7777777', aprBps: 2600, termDays: 47, installments: 5 },
    { principal: '100000000', aprBps: 0, termDays: 365, installments: 4 },
  ];

  it.each(cases)(
    'principal $principal apr $aprBps term $termDays',
    ({ principal, aprBps, termDays, installments }) => {
      const schedule = buildRepaymentSchedule(principal, aprBps, termDays, installments);
      const scheduleTotal = schedule.reduce((sum, i) => sum + BigInt(i.total), 0n);
      expect(scheduleTotal).toBe(rustTotalDue(BigInt(principal), BigInt(aprBps), BigInt(termDays)));
    },
  );

  it('never loses a stroop to rounding across the installments', () => {
    const schedule = buildRepaymentSchedule('1000003', 1700, 101, 7);
    const principalSum = schedule.reduce((s, i) => s + BigInt(i.principal), 0n);
    const interestSum = schedule.reduce((s, i) => s + BigInt(i.interest), 0n);
    expect(principalSum).toBe(1000003n);
    expect(principalSum + interestSum).toBe(rustTotalDue(1000003n, 1700n, 101n));
  });
});

describe('bandForScore matches band_for', () => {
  it.each([0, 1, 349, 350, 351, 499, 500, 501, 649, 650, 651, 799, 800, 801, 999, 1000])(
    'agrees at the boundary score %i',
    (score) => {
      expect(bandForScore(score)).toBe(rustBandFor(score));
    },
  );

  it('agrees across the whole valid range', () => {
    for (let score = 0; score <= SCORE_MAX; score++) {
      expect(bandForScore(score)).toBe(rustBandFor(score));
    }
  });
});

describe('score parameters match the credit_score contract', () => {
  it('has the same constants as credit_score/src/lib.rs:30-37', () => {
    expect({
      SCORE_MAX,
      SCORE_BASE_GAIN,
      SCORE_STREAK_BONUS_PER,
      SCORE_STREAK_BONUS_MAX,
      SCORE_LATE_PENALTY,
      SCORE_DEFAULT_PENALTY,
    }).toEqual({
      SCORE_MAX: 1000,
      SCORE_BASE_GAIN: 40,
      SCORE_STREAK_BONUS_PER: 5,
      SCORE_STREAK_BONUS_MAX: 50,
      SCORE_LATE_PENALTY: 30,
      SCORE_DEFAULT_PENALTY: 150,
    });
  });
});

describe('previewOnTimeGain matches next_score', () => {
  it('reproduces the vectors asserted in the Rust test suite', () => {
    // credit_score/src/test.rs: preview(100) -> 136, preview(950) -> 952,
    // 500 -> 520, and the streak compounding 520 -> 541.
    expect(100 + previewOnTimeGain(100, 0)).toBe(136);
    expect(950 + previewOnTimeGain(950, 0)).toBe(952);
    expect(500 + previewOnTimeGain(500, 0)).toBe(520);
    expect(520 + previewOnTimeGain(520, 1)).toBe(541);
  });

  it('agrees across the score range and every streak that changes the bonus', () => {
    for (let current = 0; current <= SCORE_MAX; current += 7) {
      for (let streak = 0; streak <= 12; streak++) {
        expect(previewOnTimeGain(current, streak)).toBe(rustOnTimeGain(current, streak));
      }
    }
  });

  it('caps the streak bonus at the same point as the contract', () => {
    // Bonus saturates at 50, i.e. streak 10 and above are identical.
    expect(previewOnTimeGain(500, 10)).toBe(previewOnTimeGain(500, 99));
    expect(rustOnTimeGain(500, 10)).toBe(rustOnTimeGain(500, 99));
  });

  it('never pushes a score past the maximum', () => {
    for (let streak = 0; streak <= 20; streak++) {
      expect(SCORE_MAX + previewOnTimeGain(SCORE_MAX, streak)).toBe(SCORE_MAX);
    }
  });
});
