'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrivy, useUser } from '@privy-io/react-auth';
import { useCreateWallet } from '@privy-io/react-auth/extended-chains';

export interface StellarWalletState {
  ready: boolean;
  authenticated: boolean;
  /** A real Stellar G… address (Privy Tier 2 chain), or null until login + wallet creation finish. */
  stellarAddress: string | null;
  creatingWallet: boolean;
  walletError: string | null;
  login: () => void;
  logout: () => void;
}

/**
 * The logged-in user's Stellar embedded wallet. Stellar is a Privy "extended
 * chain" (Tier 2): it isn't auto-created by the `embeddedWallets` provider
 * config the way Ethereum/Solana wallets are, so this hook creates one
 * explicitly via `useCreateWallet({ chainType: 'stellar' })` the first time a
 * logged-in user doesn't already have one, then reads the resulting address
 * back off `user.linkedAccounts`.
 */
export function useStellarWallet(): StellarWalletState {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { refreshUser } = useUser();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  const stellarAddress = useMemo(() => {
    const account = user?.linkedAccounts.find(
      (a) => (a as { chainType?: string }).chainType === 'stellar',
    );
    return (account as { address?: string } | undefined)?.address ?? null;
  }, [user]);

  useEffect(() => {
    if (!ready || !authenticated || stellarAddress || attempted.current) return;
    attempted.current = true;
    setCreating(true);
    setError(null);
    createWallet({ chainType: 'stellar' })
      .then(() =>
        // Linking a new account (the Stellar wallet) makes Privy reissue the
        // identity token, but the `privy-id-token` cookie our server-side
        // getSession() reads doesn't reliably carry that update yet — without
        // this, choosing a role right after wallet creation reads a stale
        // token whose linkedAccounts don't include the new wallet, and
        // chooseRole() sees no Stellar address at all.
        refreshUser(),
      )
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not create your Stellar wallet.');
      })
      .finally(() => setCreating(false));
  }, [ready, authenticated, stellarAddress, createWallet, refreshUser]);

  useEffect(() => {
    // Let a fresh login retry wallet creation if a previous attempt errored.
    if (!authenticated) attempted.current = false;
  }, [authenticated]);

  const funded = useRef(false);
  useEffect(() => {
    if (!stellarAddress || funded.current) return;
    funded.current = true;
    // Fund the fresh Testnet account with XLM so it can pay transaction fees.
    // Friendbot is idempotent-ish: calling it on an already-funded account
    // just errors harmlessly, which we ignore either way.
    fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(stellarAddress)}`).catch(() => {});
  }, [stellarAddress]);

  return {
    ready,
    authenticated,
    stellarAddress,
    creatingWallet: creating,
    walletError: error,
    login,
    logout,
  };
}
