import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLedgerDb, fakePrismaNamespace, type FakeLedgerDb } from '@/test/prisma-mock';

/**
 * Ledger invariants (SA1 P0-3).
 *
 * `LedgerEntry` is the only exact money store in the product: signed BigInt
 * stroops, append-only, balance = SUM(rows). Everything else (Opportunity,
 * Funding, Repayment) keeps whole-USDC strings and does float arithmetic on
 * them, so this module is the last place where the numbers are trustworthy.
 * These tests lock its behaviour in before SA2 touches anything.
 */

let db: FakeLedgerDb;

vi.mock('@fondealo/database', () => ({
  get prisma() {
    return db;
  },
  Prisma: fakePrismaNamespace,
}));

const {
  usdcToStroops,
  stroopsToUsdc,
  balanceStroops,
  credit,
  debit,
  ensureInitialGrant,
  InsufficientFundsError,
} = await import('./ledger');

const ADDRESS = 'GD4XTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTEST9K2Q';
const OTHER = 'GBOTHEROTHEROTHEROTHEROTHEROTHEROTHEROTHEROTHEROTHER7X1';

/**
 * The fake implements only the slice of the Prisma client these functions
 * touch, so it is cast to the exact parameter type each one declares.
 */
const asDb = (d: FakeLedgerDb) => d as unknown as Parameters<typeof balanceStroops>[0];

beforeEach(() => {
  db = createLedgerDb();
});

describe('usdcToStroops / stroopsToUsdc', () => {
  it('uses the 7-decimal USDC scale', () => {
    expect(usdcToStroops(1)).toBe(10_000_000n);
    expect(usdcToStroops(0)).toBe(0n);
    expect(usdcToStroops(10_000)).toBe(100_000_000_000n);
    expect(stroopsToUsdc(10_000_000n)).toBe(1);
  });

  it('round-trips the values the app actually handles', () => {
    for (const usdc of [0, 1, 2.5, 100, 250.25, 5_000, 25_000, 1_000_000]) {
      expect(stroopsToUsdc(usdcToStroops(usdc))).toBeCloseTo(usdc, 7);
    }
  });

  it('rounds sub-stroop input rather than truncating it', () => {
    // 0.00000005 USDC is half a stroop; Math.round takes it up.
    expect(usdcToStroops(0.00000005)).toBe(1n);
    expect(usdcToStroops(0.00000004)).toBe(0n);
  });

  it('is exact at the cent amounts the UI produces', () => {
    // 0.1 + 0.2 territory: the float multiply inside usdcToStroops must still
    // land on a whole stroop for ordinary money.
    expect(usdcToStroops(0.1)).toBe(1_000_000n);
    expect(usdcToStroops(0.3)).toBe(3_000_000n);
    expect(usdcToStroops(1234.56)).toBe(12_345_600_000n);
  });

  it('documents the precision ceiling of the float boundary (defect SA1-09)', () => {
    // `usdcToStroops` multiplies through a double, so past ~900M USDC
    // (MAX_SAFE_INTEGER / 1e7) neighbouring amounts stop being distinguishable:
    // two different USDC values collapse onto the same stroops figure.
    const a = 1_000_000_000;
    const b = 1_000_000_000.0000001; // exactly one stroop more
    expect(usdcToStroops(b) - usdcToStroops(a)).toBe(2n); // ...but it moves by 2

    // Well inside the product's limits it is exact, which is why this is
    // recorded rather than fixed: opportunities cap at 1,000,000 USDC.
    const inRange = 1_000_000;
    expect(usdcToStroops(inRange + 0.0000001)).toBe(usdcToStroops(inRange) + 1n);
  });
});

describe('balanceStroops', () => {
  it('is zero for a wallet with no history, not null', async () => {
    // Prisma's _sum is null for an empty aggregate; the module must coalesce.
    expect(await balanceStroops(asDb(db), ADDRESS)).toBe(0n);
  });

  it('is the signed sum of the wallet rows', async () => {
    db.seed(ADDRESS, 'Grant', 100_000_000n);
    db.seed(ADDRESS, 'Fund', -30_000_000n);
    db.seed(ADDRESS, 'Payout', 5_000_000n);
    expect(await balanceStroops(asDb(db), ADDRESS)).toBe(75_000_000n);
  });

  it('never mixes wallets', async () => {
    db.seed(ADDRESS, 'Grant', 100_000_000n);
    db.seed(OTHER, 'Grant', 999_000_000n);
    expect(await balanceStroops(asDb(db), ADDRESS)).toBe(100_000_000n);
    expect(await balanceStroops(asDb(db), OTHER)).toBe(999_000_000n);
  });
});

describe('credit and debit', () => {
  it('credit appends a positive row and moves the balance', async () => {
    await credit(asDb(db), { address: ADDRESS, kind: 'Deposit', amountStroops: 50_000_000n });
    expect(db.rows).toHaveLength(1);
    expect(db.balanceOf(ADDRESS)).toBe(50_000_000n);
  });

  it('debit stores the negation, so history stays append-only', async () => {
    db.seed(ADDRESS, 'Grant', 100_000_000n);
    await debit(asDb(db), { address: ADDRESS, kind: 'Fund', amountStroops: 40_000_000n });
    expect(db.rows).toHaveLength(2);
    expect(db.rows[1]!.amountStroops).toBe(-40_000_000n);
    expect(db.balanceOf(ADDRESS)).toBe(60_000_000n);
  });

  it('allows spending the balance down to exactly zero', async () => {
    db.seed(ADDRESS, 'Grant', 100_000_000n);
    await debit(asDb(db), { address: ADDRESS, kind: 'Fund', amountStroops: 100_000_000n });
    expect(db.balanceOf(ADDRESS)).toBe(0n);
  });

  it('refuses a debit one stroop over the balance and writes nothing', async () => {
    db.seed(ADDRESS, 'Grant', 100_000_000n);
    await expect(
      debit(asDb(db), { address: ADDRESS, kind: 'Fund', amountStroops: 100_000_001n }),
    ).rejects.toBeInstanceOf(InsufficientFundsError);
    expect(db.rows).toHaveLength(1);
    expect(db.balanceOf(ADDRESS)).toBe(100_000_000n);
  });

  it('reports the available balance in USDC on the error', async () => {
    db.seed(ADDRESS, 'Grant', 25_500_000n);
    await expect(
      debit(asDb(db), { address: ADDRESS, kind: 'Fund', amountStroops: 90_000_000n }),
    ).rejects.toMatchObject({ availableUsdc: 2.55 });
  });

  it('cannot take a wallet negative through repeated debits', async () => {
    db.seed(ADDRESS, 'Grant', 30_000_000n);
    await debit(asDb(db), { address: ADDRESS, kind: 'Fund', amountStroops: 20_000_000n });
    await expect(
      debit(asDb(db), { address: ADDRESS, kind: 'Fund', amountStroops: 20_000_000n }),
    ).rejects.toBeInstanceOf(InsufficientFundsError);
    expect(db.balanceOf(ADDRESS)).toBe(10_000_000n);
  });
});

describe('ensureInitialGrant', () => {
  it('grants the starting balance once', async () => {
    await ensureInitialGrant(ADDRESS);
    expect(db.balanceOf(ADDRESS)).toBe(usdcToStroops(10_000));
    expect(db.rows[0]).toMatchObject({ kind: 'Grant', idempotencyKey: 'signup-grant' });
  });

  it('is idempotent across repeated calls', async () => {
    await ensureInitialGrant(ADDRESS);
    await ensureInitialGrant(ADDRESS);
    await ensureInitialGrant(ADDRESS);
    expect(db.rows.filter((r) => r.kind === 'Grant')).toHaveLength(1);
    expect(db.balanceOf(ADDRESS)).toBe(usdcToStroops(10_000));
  });

  it('swallows the unique-constraint race rather than failing the request', async () => {
    // Two renders hitting a fresh wallet at once: both pass the findUnique
    // check, the second create loses on the unique index. That must not throw.
    const findUnique = db.ledgerEntry.findUnique.bind(db.ledgerEntry);
    db.ledgerEntry.findUnique = async () => null; // both callers see "no grant yet"
    await ensureInitialGrant(ADDRESS);
    await expect(ensureInitialGrant(ADDRESS)).resolves.toBeUndefined();
    db.ledgerEntry.findUnique = findUnique;
    expect(db.rows.filter((r) => r.kind === 'Grant')).toHaveLength(1);
  });

  it('grants each wallet separately', async () => {
    await ensureInitialGrant(ADDRESS);
    await ensureInitialGrant(OTHER);
    expect(db.balanceOf(ADDRESS)).toBe(usdcToStroops(10_000));
    expect(db.balanceOf(OTHER)).toBe(usdcToStroops(10_000));
  });
});
