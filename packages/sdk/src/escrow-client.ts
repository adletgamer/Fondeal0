/**
 * Client for the `loan_escrow` Soroban contract (docs/product-v2.md §5).
 *
 * Read methods (getOpportunity/listOpportunities/getPositions) simulate a
 * call — no signing, no fees. Write methods (create/fund/release/repay/
 * default) build and *prepare* (simulate + populate the Soroban footprint,
 * resource fee, and auth) a transaction and hand back its **unsigned**
 * XDR — they never sign anything themselves, because this SDK has no access
 * to a private key. The caller is expected to be the same address that
 * authorizes the call (business for create/release/repay, investor for
 * fund, keeper for default), so a single classic Ed25519 signature over the
 * transaction envelope satisfies both the fee-source and the contract's
 * `require_auth()` — see stellar-tx.ts for signing + submission (built for
 * Privy's raw-hash signing on Stellar's Tier 2 chain support, but signer-
 * agnostic).
 *
 * The constructor throws if no contract id is configured (no fabricated
 * contract address, ever) — that's the "not deployed yet" signal callers
 * should catch and fall back on.
 */
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
  type xdr,
} from '@stellar/stellar-sdk';
import { OpportunityStatus } from '@fondealo/types';
import { getNetworkConfig } from './config';

// Same well-known, non-existent-but-valid simulation source as PassportClient.
const SIMULATION_SOURCE = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF5';

const NOT_DEPLOYED =
  'loan_escrow is not deployed yet — see docs/product-v2.md Prompt 3 (contract) and Prompt 6 (wiring).';

/** On-chain escrow opportunity. Amounts are USDC stroops as bigint-strings. */
export interface EscrowOpportunity {
  opportunityId: string;
  business: string;
  principal: string;
  collateralAmount: string;
  funded: string;
  aprBps: number;
  termDays: number;
  status: OpportunityStatus;
}

/** An investor's funding position in one opportunity. */
export interface EscrowPosition {
  opportunityId: string;
  investor: string;
  amount: string;
}

/** An unsigned, fully-prepared transaction ready for an external signer. */
export interface UnsignedTx {
  xdr: string;
}

export class EscrowClient {
  private readonly server: rpc.Server;
  private readonly contract: Contract;
  private readonly networkPassphrase: string;

  constructor(contractId?: string) {
    const cfg = getNetworkConfig();
    const id = contractId ?? cfg.escrowContractId;
    if (!id) {
      throw new Error(
        `EscrowClient: no contract id. Set NEXT_PUBLIC_ESCROW_CONTRACT_ID or pass one — ${NOT_DEPLOYED}`,
      );
    }
    this.server = new rpc.Server(cfg.sorobanRpcUrl, {
      allowHttp: cfg.sorobanRpcUrl.startsWith('http://'),
    });
    this.contract = new Contract(id);
    this.networkPassphrase = cfg.networkPassphrase;
  }

  // ---- Read (simulated — no signing, no fees) ----

  /** Read one opportunity, or `null` if it doesn't exist. */
  async getOpportunity(opportunityId: string): Promise<EscrowOpportunity | null> {
    const arg = nativeToScVal(BigInt(opportunityId), { type: 'u64' });
    const raw = await this.simulateRead('get_opportunity', [arg]);
    if (raw === null || raw === undefined) return null;
    return normalizeOpportunity(raw as Record<string, unknown>);
  }

  /** List all opportunities known to the escrow. */
  async listOpportunities(): Promise<EscrowOpportunity[]> {
    const raw = await this.simulateRead('list_opportunities', []);
    if (!Array.isArray(raw)) return [];
    return raw.map((o) => normalizeOpportunity(o as Record<string, unknown>));
  }

  /** List an investor's funding positions across all opportunities. */
  async getPositions(investor: string): Promise<EscrowPosition[]> {
    const arg = new Address(investor).toScVal();
    const raw = await this.simulateRead('get_positions', [arg]);
    if (!Array.isArray(raw)) return [];
    return raw.map((p) => normalizePosition(investor, p as Record<string, unknown>));
  }

  // ---- Write (build + prepare an unsigned tx; caller signs and submits — see stellar-tx.ts) ----

  /** Business-gated: locks `collateralAmount` and opens the opportunity. */
  async create(
    opportunityId: string,
    business: string,
    principal: string,
    termDays: number,
    collateralAmount: string,
    aprBps: number,
  ): Promise<UnsignedTx> {
    const args = [
      nativeToScVal(BigInt(opportunityId), { type: 'u64' }),
      new Address(business).toScVal(),
      nativeToScVal(BigInt(principal), { type: 'i128' }),
      nativeToScVal(termDays, { type: 'u32' }),
      nativeToScVal(BigInt(collateralAmount), { type: 'i128' }),
      nativeToScVal(aprBps, { type: 'u32' }),
    ];
    return this.buildTransaction(business, 'create', args);
  }

  /** Pulls `amount` USDC from `investor` into the opportunity. */
  async fund(opportunityId: string, investor: string, amount: string): Promise<UnsignedTx> {
    const args = [
      nativeToScVal(BigInt(opportunityId), { type: 'u64' }),
      new Address(investor).toScVal(),
      nativeToScVal(BigInt(amount), { type: 'i128' }),
    ];
    return this.buildTransaction(investor, 'fund', args);
  }

  /** On fully funded: transfers principal to the business; collateral stays locked. */
  async release(opportunityId: string, business: string): Promise<UnsignedTx> {
    const args = [nativeToScVal(BigInt(opportunityId), { type: 'u64' })];
    return this.buildTransaction(business, 'release', args);
  }

  /** Business repayment; on the final installment, distributes to investors and returns collateral. */
  async repay(opportunityId: string, business: string, amount: string): Promise<UnsignedTx> {
    const args = [
      nativeToScVal(BigInt(opportunityId), { type: 'u64' }),
      nativeToScVal(BigInt(amount), { type: 'i128' }),
    ];
    return this.buildTransaction(business, 'repay', args);
  }

  /** Callable after due + grace: seizes collateral pro-rata to investors, marks Defaulted. */
  async default(opportunityId: string, keeper: string): Promise<UnsignedTx> {
    const args = [nativeToScVal(BigInt(opportunityId), { type: 'u64' })];
    return this.buildTransaction(keeper, 'default', args);
  }

  private async buildTransaction(
    sourceAddress: string,
    method: string,
    args: xdr.ScVal[],
  ): Promise<UnsignedTx> {
    const account = await this.server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(60)
      .build();
    const prepared = await this.server.prepareTransaction(tx);
    return { xdr: prepared.toXDR() };
  }

  private async simulateRead(method: string, args: xdr.ScVal[]): Promise<unknown> {
    const source = new Account(SIMULATION_SOURCE, '0');
    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw new Error(`Escrow simulation failed for ${method}: ${sim.error}`);
    }
    const retval = sim.result?.retval;
    return retval ? scValToNative(retval) : null;
  }
}

function normalizeOpportunity(raw: Record<string, unknown>): EscrowOpportunity {
  return {
    opportunityId: String(raw['opportunity_id'] ?? ''),
    business: String(raw['business'] ?? ''),
    principal: String(raw['principal'] ?? '0'),
    collateralAmount: String(raw['collateral_amount'] ?? '0'),
    funded: String(raw['funded'] ?? '0'),
    aprBps: Number(raw['apr_bps'] ?? 0),
    termDays: Number(raw['term_days'] ?? 0),
    status: decodeStatus(raw['status']),
  };
}

function normalizePosition(investor: string, raw: Record<string, unknown>): EscrowPosition {
  return {
    opportunityId: String(raw['opportunity_id'] ?? ''),
    investor,
    amount: String(raw['amount'] ?? '0'),
  };
}

function decodeStatus(value: unknown): OpportunityStatus {
  if (typeof value === 'string' && value in OpportunityStatus) return value as OpportunityStatus;
  return OpportunityStatus.Draft;
}
