/**
 * Wallet abstraction over Stellar Wallets Kit (v2, static API) — one interface
 * across Freighter, xBull, Albedo, Lobstr, and Hana. Freighter is the default.
 *
 * Browser-only: call these from client components.
 */
import { Networks, StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { HanaModule } from '@creit.tech/stellar-wallets-kit/modules/hana';
import { getNetworkConfig } from './config';

let initialized = false;

/** Initialize the Wallets Kit once (idempotent). */
export function initWalletKit(): void {
  if (initialized) return;
  const cfg = getNetworkConfig();
  StellarWalletsKit.init({
    modules: [
      new FreighterModule(),
      new xBullModule(),
      new AlbedoModule(),
      new LobstrModule(),
      new HanaModule(),
    ],
    selectedWalletId: FREIGHTER_ID,
    network: cfg.network === 'public' ? Networks.PUBLIC : Networks.TESTNET,
  });
  initialized = true;
}

export interface ConnectedWallet {
  address: string;
}

/** Open the wallet picker and return the selected account address. */
export async function connectWallet(): Promise<ConnectedWallet> {
  initWalletKit();
  const { address } = await StellarWalletsKit.authModal();
  return { address };
}

/** The address currently held in the kit's memory (after a prior connect). */
export async function getConnectedAddress(): Promise<string> {
  const { address } = await StellarWalletsKit.getAddress();
  return address;
}

/** Sign a base64 transaction XDR with the connected wallet (used by SEP-10 next). */
export async function signTransactionXdr(xdr: string, networkPassphrase: string): Promise<string> {
  initWalletKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, { networkPassphrase });
  return signedTxXdr;
}
