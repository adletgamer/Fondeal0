/**
 * Splits `pool` (integer stroops) across `weights` proportionally, in integer
 * math. Every share is floored and the last non-zero weight absorbs the
 * remainder, so the shares always sum to exactly `pool` — no stroop is created
 * or lost when a repayment is paid out to several funders.
 */
export function splitProRata(pool: bigint, weights: bigint[]): bigint[] {
  const total = weights.reduce((a, b) => a + b, BigInt(0));
  if (total <= BigInt(0) || pool <= BigInt(0)) return weights.map(() => BigInt(0));

  const lastIdx = weights.reduce((idx, w, i) => (w > BigInt(0) ? i : idx), -1);
  const shares = weights.map((w) => (pool * w) / total);
  const distributed = shares.reduce((a, b) => a + b, BigInt(0));
  shares[lastIdx] = (shares[lastIdx] ?? BigInt(0)) + (pool - distributed);
  return shares;
}
