/**
 * Client for the `loan_escrow` Soroban contract (docs/product-v2.md §5).
 *
 * The contract does not exist yet — it ships in Prompt 3 of the product-v2
 * build plan — so every write method (create/fund/release/repay/default)
 * throws until then. Read methods are wired to the same simulate-based
 * machinery as {@link PassportClient} so they start working the moment a
 * real Testnet contract id is configured; nothing here ever falls back to a
 * fabricated contract id or fake data. The on-chain method names below
 * (`get_opportunity`, `list_opportunities`, `get_positions`) are this
 * skeleton's best-effort mirror of §5 and may need a rename once the real
 * contract's exported functions are finalized in Prompt 3.
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

  // ---- Write (typed stubs until Prompt 6) ----

  /** Business-gated: locks `collateralAmount` and opens the opportunity. */
  async create(
    _opportunityId: string,
    _business: string,
    _principal: string,
    _termDays: number,
    _collateralAmount: string,
    _aprBps: number,
  ): Promise<never> {
    throw new Error(`EscrowClient.create: ${NOT_DEPLOYED}`);
  }

  /** Pulls `amount` USDC from `investor` into the opportunity. */
  async fund(_opportunityId: string, _investor: string, _amount: string): Promise<never> {
    throw new Error(`EscrowClient.fund: ${NOT_DEPLOYED}`);
  }

  /** On fully funded: transfers principal to the business; collateral stays locked. */
  async release(_opportunityId: string): Promise<never> {
    throw new Error(`EscrowClient.release: ${NOT_DEPLOYED}`);
  }

  /** Business repayment; on the final installment, distributes to investors and returns collateral. */
  async repay(_opportunityId: string, _amount: string): Promise<never> {
    throw new Error(`EscrowClient.repay: ${NOT_DEPLOYED}`);
  }

  /** Callable after due + grace: seizes collateral pro-rata to investors, marks Defaulted. */
  async default(_opportunityId: string): Promise<never> {
    throw new Error(`EscrowClient.default: ${NOT_DEPLOYED}`);
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
