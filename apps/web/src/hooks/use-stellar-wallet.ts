'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrivy, useUser } from '@privy-io/react-auth';
import { useCreateWallet } from '@privy-io/react-auth/extended-chains';

/** Auto-retry Stellar wallet creation a couple of times before asking the user to reload. */
const MAX_CREATE_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

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
  const [retryTick, setRetryTick] = useState(0);
  const attempts = useRef(0);

  const stellarAddress = useMemo(() => {
    const account = user?.linkedAccounts.find(
      (a) => (a as { chainType?: string }).chainType === 'stellar',
    );
    return (account as { address?: string } | undefined)?.address ?? null;
  }, [user]);

  useEffect(() => {
    // Wait for `user` to actually hydrate — `authenticated` flips true a beat
    // before `user.linkedAccounts` is populated, and acting on that gap can
    // fire createWallet for someone who already has a Stellar wallet.
    if (!ready || !authenticated || !user || stellarAddress) return;
    if (attempts.current >= MAX_CREATE_ATTEMPTS) return;

    let cancelled = false;
    attempts.current += 1;
    setCreating(true);
    setError(null);

    createWallet({ chainType: 'stellar' })
      .then(() =>
        // Linking a new account (the Stellar wallet) makes Privy reissue the
        // identity token; refreshUser() pulls that fresh token client-side so
        // <SessionSync> can push it to the server before the user picks a
        // role — otherwise chooseRole() reads a token whose linkedAccounts
        // don't include the new wallet and sees no Stellar address at all.
        refreshUser(),
      )
      .catch((err) => {
        if (cancelled) return;
        const retriable = attempts.current < MAX_CREATE_ATTEMPTS;
        setError(
          (err instanceof Error ? err.message : 'Could not create your Stellar wallet.') +
            (retriable ? ' Retrying…' : ' Please refresh the page.'),
        );
        if (retriable) {
          window.setTimeout(() => !cancelled && setRetryTick((t) => t + 1), RETRY_DELAY_MS);
        }
      })
      .finally(() => !cancelled && setCreating(false));

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, user, stellarAddress, createWallet, refreshUser, retryTick]);

  useEffect(() => {
    // Let a fresh login retry wallet creation if every attempt errored.
    if (!authenticated) attempts.current = 0;
  }, [authenticated]);

  const funded = useRef(false);
  useEffect(() => {
    if (!stellarAddress || funded.current) return;
    funded.current = true;
    // Fund the fresh Testnet account with XLM so it can pay transaction fees.
    // Friendbot is idempotent-ish: calling it on an already-funded account
    // just errors harmlessly, which we ignore either way.
    fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(stellarAddress)}`).catch(
      () => {},
    );
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
