/**
 * Stablecoin funding providers — how a user gets USDC into Fondealo.
 *
 * Today only the Testnet faucet exists (credits mock USDC to the off-chain
 * ledger). The planned rails mirror the Stellar-native options described in
 * docs/strategy/verifier-network.md: cash ramps and SEP-24 anchors that hand
 * the user real USDC on Stellar. They are listed as "planned", never as live.
 */

export interface FundingProvider {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'planned';
  fee: string;
  eta: string;
}

export const FUNDING_PROVIDERS: FundingProvider[] = [
  {
    id: 'sandbox-faucet',
    name: 'Fondealo Test Faucet',
    description: 'Instantly credits Testnet USDC. Free, no card — not real money.',
    status: 'available',
    fee: '0%',
    eta: 'Instant',
  },
  {
    id: 'cash-ramp',
    name: 'Cash on-ramp (USDC on Stellar)',
    description: 'Buy USDC with cash at partner locations through a Stellar ramp.',
    status: 'planned',
    fee: 'Set by provider',
    eta: 'Minutes',
  },
  {
    id: 'sep24-anchor',
    name: 'Bank transfer via SEP-24 anchor',
    description: 'Deposit local currency by bank transfer and receive USDC on Stellar.',
    status: 'planned',
    fee: 'Set by anchor',
    eta: '1–2 business days',
  },
];

/** Test balance every wallet starts with, granted once on first use. */
export const INITIAL_TEST_BALANCE_USDC = 10_000;
/** Largest single faucet top-up. */
export const MAX_FAUCET_DEPOSIT_USDC = 25_000;
export const FAUCET_PRESETS_USDC = [100, 500, 1_000, 5_000] as const;

export const USDC_STROOPS = 10_000_000;
