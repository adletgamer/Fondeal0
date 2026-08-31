'use client';

import { Suspense, type ReactNode } from 'react';
import { Button, Card, Container } from '@fondealo/ui';
import { useStellarWallet, type StellarWalletState } from '@/hooks/use-stellar-wallet';
import { Lock, ShieldCheck, Sparkle } from './icons';

const PRIVY_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

/**
 * Gates /invest and /business behind a real login: email/social sign-in via
 * Privy creates a real Stellar keypair (Tier 2 chain support) on first use —
 * no seed phrase, no browser extension required. Server components under
 * these sections resolve identity from the verified session cookie
 * (`getSession()`), never from the URL — the connected address is
 * deliberately kept out of the query string.
 *
 * Split into an outer component that never calls a Privy hook and an inner
 * one that always does, so `useStellarWallet` (which needs `PrivyProvider`
 * in the tree) is only ever mounted when Privy is actually configured —
 * no conditional hook calls.
 */
export function AuthGate({
  section,
  children,
}: {
  section: 'invest' | 'business';
  children: ReactNode;
}) {
  if (!PRIVY_CONFIGURED) {
    return (
      <main className="bg-slate-50 py-20">
        <Container>
          <Card className="mx-auto max-w-lg p-8 text-center">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Lock width={22} height={22} />
            </span>
            <h1 className="font-display text-xl font-bold text-slate-900">
              Login not configured yet
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              This section is gated behind a Privy login, but{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                NEXT_PUBLIC_PRIVY_APP_ID
              </code>{' '}
              isn&apos;t set. Add it (and{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">PRIVY_APP_SECRET</code>)
              to enable real login and Stellar wallet creation.
            </p>
          </Card>
        </Container>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="grid min-h-[60vh] place-items-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        </main>
      }
    >
      <ConnectedAuthGate section={section}>{children}</ConnectedAuthGate>
    </Suspense>
  );
}

function ConnectedAuthGate({
  section,
  children,
}: {
  section: 'invest' | 'business';
  children: ReactNode;
}) {
  const wallet = useStellarWallet();
  return (
    <AuthGateContent section={section} wallet={wallet}>
      {children}
    </AuthGateContent>
  );
}

function AuthGateContent({
  section,
  wallet,
  children,
}: {
  section: 'invest' | 'business';
  wallet: StellarWalletState;
  children: ReactNode;
}) {
  const { ready, authenticated, stellarAddress, creatingWallet, walletError, login } = wallet;

  if (!ready) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="relative overflow-hidden bg-night-950 py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
        <Container className="relative">
          <Card className="mx-auto max-w-lg border-white/10 bg-white/5 p-8 text-center backdrop-blur">
            <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
              <Sparkle width={24} height={24} />
            </span>
            <h1 className="font-display text-2xl font-bold text-white">
              {section === 'invest' ? 'Log in to invest' : 'Log in to your business'}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              One login creates a real Stellar wallet for you — no seed phrase, no extension. It
              takes about ten seconds.
            </p>
            <Button onClick={login} size="lg" className="mt-6 w-full">
              Log in &amp; create my wallet
            </Button>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck width={14} height={14} />
              Powered by Privy · Stellar Testnet
            </div>
          </Card>
        </Container>
      </main>
    );
  }

  if (creatingWallet || !stellarAddress) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm font-medium text-slate-600">Setting up your Stellar wallet…</p>
          {walletError ? (
            <p className="mt-2 max-w-xs text-xs text-red-600">
              {walletError} Try refreshing the page.
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
