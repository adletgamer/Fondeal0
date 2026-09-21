import { Prisma, prisma, type LedgerKind } from '@fondealo/database';
import { INITIAL_TEST_BALANCE_USDC, USDC_STROOPS } from '@/lib/providers/funding';

/**
 * Server-only USDC ledger for the Testnet/mock balances. A wallet's balance is
 * the SUM of its append-only `LedgerEntry` rows (signed stroops), so every
 * movement — faucet, collateral, funding, repayment, payout — is auditable and
 * a balance can never drift from its history. Amounts leave this module as
 * plain USDC numbers (BigInt can't cross the server → client boundary).
 */

type Db = Prisma.TransactionClient | typeof prisma;

export const usdcToStroops = (usdc: number): bigint => BigInt(Math.round(usdc * USDC_STROOPS));
export const stroopsToUsdc = (stroops: bigint): number => Number(stroops) / USDC_STROOPS;

export class InsufficientFundsError extends Error {
  constructor(public readonly availableUsdc: number) {
    super(`Insufficient balance: ${availableUsdc.toLocaleString()} USDC available.`);
  }
}

export async function balanceStroops(db: Db, address: string): Promise<bigint> {
  const { _sum } = await db.ledgerEntry.aggregate({
    where: { stellarAddress: address },
    _sum: { amountStroops: true },
  });
  return _sum.amountStroops ?? BigInt(0);
}

interface EntryInput {
  address: string;
  kind: LedgerKind;
  amountStroops: bigint;
  provider?: string;
  reference?: string;
  idempotencyKey?: string;
}

export function credit(db: Db, e: EntryInput) {
  return db.ledgerEntry.create({
    data: {
      stellarAddress: e.address,
      kind: e.kind,
      amountStroops: e.amountStroops,
      provider: e.provider,
      reference: e.reference,
      idempotencyKey: e.idempotencyKey,
    },
  });
}

/** Debits a positive `amountStroops`; throws `InsufficientFundsError` if the balance can't cover it. */
export async function debit(db: Db, e: EntryInput) {
  const available = await balanceStroops(db, e.address);
  if (available < e.amountStroops) throw new InsufficientFundsError(stroopsToUsdc(available));
  return credit(db, { ...e, amountStroops: -e.amountStroops });
}

function isUniqueConflict(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === 'P2002';
}

/** Grants the starting test balance exactly once per wallet (idempotent, race-safe). */
export async function ensureInitialGrant(address: string): Promise<void> {
  const existing = await prisma.ledgerEntry.findUnique({
    where: {
      stellarAddress_idempotencyKey: { stellarAddress: address, idempotencyKey: 'signup-grant' },
    },
    select: { id: true },
  });
  if (existing) return;
  try {
    await credit(prisma, {
      address,
      kind: 'Grant',
      amountStroops: usdcToStroops(INITIAL_TEST_BALANCE_USDC),
      provider: 'sandbox-faucet',
      reference: 'Initial test balance',
      idempotencyKey: 'signup-grant',
    });
  } catch (err) {
    if (!isUniqueConflict(err)) throw err;
  }
}

export interface LedgerRow {
  id: string;
  kind: LedgerKind;
  amountUsdc: number;
  provider: string | null;
  reference: string | null;
  createdAt: string;
}

export interface WalletSummary {
  balanceUsdc: number;
  recent: LedgerRow[];
}

/** Balance + recent activity for a wallet, or `null` if the database can't be reached. */
export async function getWalletSummary(address: string): Promise<WalletSummary | null> {
  try {
    await ensureInitialGrant(address);
    const [balance, rows] = await Promise.all([
      balanceStroops(prisma, address),
      prisma.ledgerEntry.findMany({
        where: { stellarAddress: address },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);
    return {
      balanceUsdc: stroopsToUsdc(balance),
      recent: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        amountUsdc: stroopsToUsdc(r.amountStroops),
        provider: r.provider,
        reference: r.reference,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch (err) {
    console.error('[ledger] getWalletSummary failed:', (err as Error).message?.slice(0, 200));
    return null;
  }
}

/**
 * Runs `fn` in a SERIALIZABLE transaction so two concurrent spends can't both
 * pass the balance check; retries on serialization failures (P2034).
 */
export async function withSerializableRetry<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15_000,
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2034' && attempt < 2) continue;
      throw err;
    }
  }
}
