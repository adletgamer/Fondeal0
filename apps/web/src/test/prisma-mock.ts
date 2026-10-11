/**
 * In-memory stand-ins for the Prisma client, for unit tests (SA1).
 *
 * These are deliberately behavioural rather than `vi.fn()` stubs: the ledger is
 * an append-only table whose balance is a SUM, so a fake that actually stores
 * rows and sums them catches arithmetic and ordering bugs that a stub asserting
 * "create was called" never would.
 *
 * Two Prisma behaviours are reproduced on purpose because the production code
 * depends on them:
 *   - `aggregate._sum.<field>` is **null**, not 0, when no rows match.
 *   - a unique-constraint violation throws an error carrying `code: 'P2002'`.
 *
 * What this does NOT reproduce: real SERIALIZABLE isolation, concurrent
 * transactions, or rollback. Those need a real Postgres and are deferred to
 * SA2; tests here cover arithmetic and branching only.
 */

export type LedgerKind =
  | 'Grant'
  | 'Deposit'
  | 'Fund'
  | 'Repay'
  | 'Payout'
  | 'Collateral'
  | 'CollateralReturn'
  | 'Withdraw';

export interface FakeLedgerRow {
  id: string;
  stellarAddress: string;
  kind: LedgerKind;
  amountStroops: bigint;
  provider: string | null;
  reference: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
}

export class FakePrismaError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'FakePrismaError';
  }
}

let seq = 0;
const nextId = () => `row_${++seq}`;

export interface FakeLedgerDb {
  rows: FakeLedgerRow[];
  ledgerEntry: {
    aggregate(args: {
      where: { stellarAddress: string };
      _sum: { amountStroops: true };
    }): Promise<{ _sum: { amountStroops: bigint | null } }>;
    create(args: { data: Omit<FakeLedgerRow, 'id' | 'createdAt'> }): Promise<FakeLedgerRow>;
    findUnique(args: {
      where: { stellarAddress_idempotencyKey: { stellarAddress: string; idempotencyKey: string } };
      select?: unknown;
    }): Promise<FakeLedgerRow | null>;
    findMany(args?: {
      where?: { stellarAddress?: string };
      orderBy?: { createdAt: 'asc' | 'desc' };
      take?: number;
    }): Promise<FakeLedgerRow[]>;
  };
  /** Total signed stroops for an address, computed independently of the code under test. */
  balanceOf(address: string): bigint;
  seed(address: string, kind: LedgerKind, amountStroops: bigint): FakeLedgerRow;
}

export function createLedgerDb(): FakeLedgerDb {
  const rows: FakeLedgerRow[] = [];

  const db: FakeLedgerDb = {
    rows,
    ledgerEntry: {
      async aggregate({ where }) {
        const matching = rows.filter((r) => r.stellarAddress === where.stellarAddress);
        // Prisma returns null, not 0, for an empty aggregate.
        if (matching.length === 0) return { _sum: { amountStroops: null } };
        return {
          _sum: { amountStroops: matching.reduce((sum, r) => sum + r.amountStroops, 0n) },
        };
      },

      async create({ data }) {
        const key = data.idempotencyKey ?? null;
        // Postgres treats NULLs as distinct, so the unique index only bites
        // when a key is actually present. The production grant relies on this.
        if (key !== null) {
          const clash = rows.some(
            (r) => r.stellarAddress === data.stellarAddress && r.idempotencyKey === key,
          );
          if (clash) {
            throw new FakePrismaError(
              'P2002',
              'Unique constraint failed on the fields: (`stellarAddress`,`idempotencyKey`)',
            );
          }
        }
        const row: FakeLedgerRow = {
          id: nextId(),
          createdAt: new Date(),
          ...data,
          provider: data.provider ?? null,
          reference: data.reference ?? null,
          idempotencyKey: data.idempotencyKey ?? null,
        };
        rows.push(row);
        return row;
      },

      async findUnique({ where }) {
        const { stellarAddress, idempotencyKey } = where.stellarAddress_idempotencyKey;
        return (
          rows.find(
            (r) => r.stellarAddress === stellarAddress && r.idempotencyKey === idempotencyKey,
          ) ?? null
        );
      },

      async findMany(args) {
        let out = [...rows];
        if (args?.where?.stellarAddress !== undefined) {
          out = out.filter((r) => r.stellarAddress === args.where!.stellarAddress);
        }
        if (args?.orderBy?.createdAt === 'desc') out.reverse();
        if (args?.take !== undefined) out = out.slice(0, args.take);
        return out;
      },
    },

    balanceOf(address) {
      return rows
        .filter((r) => r.stellarAddress === address)
        .reduce((sum, r) => sum + r.amountStroops, 0n);
    },

    seed(address, kind, amountStroops) {
      const row: FakeLedgerRow = {
        id: nextId(),
        stellarAddress: address,
        kind,
        amountStroops,
        provider: null,
        reference: null,
        idempotencyKey: null,
        createdAt: new Date(),
      };
      rows.push(row);
      return row;
    },
  };

  return db;
}

/** The subset of the `Prisma` namespace that the modules under test read at runtime. */
export const fakePrismaNamespace = {
  TransactionIsolationLevel: { Serializable: 'Serializable' as const },
};
