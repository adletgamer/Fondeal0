import { describe, expect, it } from 'vitest';
import { splitProRata } from './ledger';

const B = (n: number) => BigInt(n);
const sum = (xs: bigint[]) => xs.reduce((a, b) => a + b, B(0));

describe('splitProRata', () => {
  it('splits proportionally to the weights', () => {
    expect(splitProRata(B(1000), [B(1), B(3)])).toEqual([B(250), B(750)]);
  });

  it('always sums to exactly the pool (remainder goes to the last funder)', () => {
    const shares = splitProRata(B(100), [B(1), B(1), B(1)]);
    expect(sum(shares)).toBe(B(100));
    expect(shares).toEqual([B(33), B(33), B(34)]);
  });

  it('handles a single funder', () => {
    expect(splitProRata(B(5_000_000), [B(42)])).toEqual([B(5_000_000)]);
  });

  it('gives nothing to zero-weight funders and the remainder to the last real one', () => {
    expect(splitProRata(B(10), [B(1), B(0), B(2), B(0)])).toEqual([B(3), B(0), B(7), B(0)]);
  });

  it('returns all zeros when there is nothing to split or no weight', () => {
    expect(splitProRata(B(0), [B(1), B(2)])).toEqual([B(0), B(0)]);
    expect(splitProRata(B(10), [B(0), B(0)])).toEqual([B(0), B(0)]);
    expect(splitProRata(B(10), [])).toEqual([]);
  });

  it('works at USDC scale without precision loss', () => {
    const pool = B(123_456_789_012);
    const shares = splitProRata(pool, [B(10_000_000_000), B(25_000_000_000), B(65_000_000_000)]);
    expect(sum(shares)).toBe(pool);
  });
});
