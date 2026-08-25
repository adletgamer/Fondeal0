/**
 * Read-only client for the `business_passport` Soroban contract.
 *
 * Reads are done by simulating a contract invocation against Soroban RPC — no
 * signing, no fees. Write paths (issue / set_kyb / apply_reputation) are
 * authorized by the `writer` key and are built server-side; they are added in
 * the Phase 4 integration once the contract is deployed and its ID is known.
 */
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  rpc,
  scValToNative,
  TransactionBuilder,
  type xdr,
} from '@stellar/stellar-sdk';
import { bandForScore, KybStatus, type Passport, type RiskBand } from '@fondealo/types';
import { getNetworkConfig } from './config';

// A well-known, non-existent-but-valid account used only as the simulation
// source. Simulation never touches this account's state.
const SIMULATION_SOURCE = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF5';

const KYB_BY_INDEX: readonly KybStatus[] = [
  KybStatus.None,
  KybStatus.Processing,
  KybStatus.Accepted,
  KybStatus.Rejected,
];

export class PassportClient {
  private readonly server: rpc.Server;
  private readonly contract: Contract;
  private readonly networkPassphrase: string;

  constructor(contractId?: string) {
    const cfg = getNetworkConfig();
    const id = contractId ?? cfg.passportContractId;
    if (!id) {
      throw new Error(
        'PassportClient: no contract id. Set NEXT_PUBLIC_PASSPORT_CONTRACT_ID or pass one.',
      );
    }
    this.server = new rpc.Server(cfg.sorobanRpcUrl, {
      allowHttp: cfg.sorobanRpcUrl.startsWith('http://'),
    });
    this.contract = new Contract(id);
    this.networkPassphrase = cfg.networkPassphrase;
  }

  /** Read a business's Passport, or `null` if none exists. */
  async get(business: string): Promise<Passport | null> {
    const arg = new Address(business).toScVal();
    const raw = await this.simulateRead('get', [arg]);
    if (raw === null || raw === undefined) return null;
    return normalizePassport(business, raw as Record<string, unknown>);
  }

  /** Whether a Passport exists for `business`. */
  async exists(business: string): Promise<boolean> {
    const arg = new Address(business).toScVal();
    const raw = await this.simulateRead('exists', [arg]);
    return Boolean(raw);
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
      throw new Error(`Passport simulation failed for ${method}: ${sim.error}`);
    }
    const retval = sim.result?.retval;
    return retval ? scValToNative(retval) : null;
  }
}

/**
 * Map the raw decoded contract struct (snake_case fields, enum indices) into the
 * app-facing {@link Passport}. Kept defensive because ScVal decoding of enums can
 * surface either the variant name or its integer index depending on encoding.
 */
export function normalizePassport(business: string, raw: Record<string, unknown>): Passport {
  const score = Number(raw['score'] ?? 0);
  const riskBand = (raw['risk_band'] as RiskBand) ?? bandForScore(score);
  return {
    business,
    kybStatus: decodeKyb(raw['kyb_status']),
    score,
    riskBand,
    loansTotal: Number(raw['loans_total'] ?? 0),
    loansRepaid: Number(raw['loans_repaid'] ?? 0),
    onTimeStreak: Number(raw['on_time_streak'] ?? 0),
    issuedAt: Number(raw['issued_at'] ?? 0),
    updatedAt: Number(raw['updated_at'] ?? 0),
    dataHash: String(raw['data_hash'] ?? ''),
  };
}

function decodeKyb(value: unknown): KybStatus {
  if (typeof value === 'string' && value in KybStatus) return value as KybStatus;
  if (typeof value === 'number' && KYB_BY_INDEX[value]) return KYB_BY_INDEX[value] as KybStatus;
  return KybStatus.None;
}
