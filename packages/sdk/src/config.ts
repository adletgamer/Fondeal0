/** Network configuration, resolved from environment with Testnet defaults. */
import { Networks } from '@stellar/stellar-sdk';

export interface FondealoNetworkConfig {
  network: 'testnet' | 'public';
  networkPassphrase: string;
  sorobanRpcUrl: string;
  horizonUrl: string;
  usdcSacAddress: string | undefined;
  passportContractId: string | undefined;
  scoreContractId: string | undefined;
  escrowContractId: string | undefined;
}

function env(key: string): string | undefined {
  // Works in both Next public runtime and Node.
  return typeof process !== 'undefined' ? process.env[key] : undefined;
}

export function getNetworkConfig(): FondealoNetworkConfig {
  const network = (env('NEXT_PUBLIC_STELLAR_NETWORK') ?? 'testnet') as 'testnet' | 'public';
  return {
    network,
    networkPassphrase:
      env('NEXT_PUBLIC_NETWORK_PASSPHRASE') ??
      (network === 'public' ? Networks.PUBLIC : Networks.TESTNET),
    sorobanRpcUrl: env('NEXT_PUBLIC_SOROBAN_RPC_URL') ?? 'https://soroban-testnet.stellar.org',
    horizonUrl: env('NEXT_PUBLIC_HORIZON_URL') ?? 'https://horizon-testnet.stellar.org',
    usdcSacAddress: env('NEXT_PUBLIC_USDC_SAC_ADDRESS'),
    passportContractId: env('NEXT_PUBLIC_PASSPORT_CONTRACT_ID'),
    scoreContractId: env('NEXT_PUBLIC_SCORE_CONTRACT_ID'),
    escrowContractId: env('NEXT_PUBLIC_ESCROW_CONTRACT_ID'),
  };
}
