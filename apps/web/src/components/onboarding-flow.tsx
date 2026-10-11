'use client';

import { Suspense, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Container } from '@fondealo/ui';
import { useStellarWallet, type StellarWalletState } from '@/hooks/use-stellar-wallet';
import { chooseRole } from '@/lib/actions/onboarding';
import { ArrowRight, Building, Landmark, ShieldCheck, Sparkle } from './icons';

const PRIVY_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="relative overflow-hidden bg-night-950 py-24">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
      <Container className="relative">{children}</Container>
    </main>
  );
}

function Spinner() {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </main>
  );
}

/**
 * States 2–4 of the onboarding flow (state 1, "Get Started", is the landing
 * page's CTA; state 5's redirect happens inside the `chooseRole` action).
 * State 5's target once a role already exists is decided server-side in
 * app/onboarding/page.tsx before this component ever mounts.
 */
export function OnboardingFlow({
  hasServerSession,
  hasServerWallet,
  accountServiceUnavailable = false,
}: {
  hasServerSession: boolean;
  hasServerWallet: boolean;
  accountServiceUnavailable?: boolean;
}) {
  const router = useRouter();
  if (!PRIVY_CONFIGURED) {
    return (
      <Shell>
        <Card className="mx-auto max-w-lg border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <h1 className="font-display text-xl font-bold text-white">
            Sign-in is unavailable in this preview
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Account creation and login need a configured Privy app and database. This local preview
            does not have a safe test environment connected yet.
          </p>
          <Button variant="ghost-light" className="mt-6" onClick={() => router.push('/')}>
            Go back
          </Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Suspense fallback={<Spinner />}>
      <ConnectedOnboarding
        hasServerSession={hasServerSession}
        hasServerWallet={hasServerWallet}
        accountServiceUnavailable={accountServiceUnavailable}
      />
    </Suspense>
  );
}

function ConnectedOnboarding({
  hasServerSession,
  hasServerWallet,
  accountServiceUnavailable,
}: {
  hasServerSession: boolean;
  hasServerWallet: boolean;
  accountServiceUnavailable: boolean;
}) {
  const wallet = useStellarWallet();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent') === 'invest' ? 'Investor' : 'Business';
  return (
    <OnboardingContent
      wallet={wallet}
      intent={intent}
      hasServerSession={hasServerSession}
      hasServerWallet={hasServerWallet}
      accountServiceUnavailable={accountServiceUnavailable}
    />
  );
}

function OnboardingContent({
  wallet,
  intent,
  hasServerSession,
  hasServerWallet,
  accountServiceUnavailable,
}: {
  wallet: StellarWalletState;
  intent: 'Business' | 'Investor';
  hasServerSession: boolean;
  hasServerWallet: boolean;
  accountServiceUnavailable: boolean;
}) {
  const router = useRouter();
  const { ready, authenticated, stellarAddress, creatingWallet, walletError, login } = wallet;
  const [isPending, startTransition] = useTransition();
  const [roleError, setRoleError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'Business' | 'Investor' | null>(null);
  const refreshRequested = useRef(false);

  useEffect(() => {
    // Wallet linking can finish after the first server render. Refresh once
    // when the client has a wallet so getSession can resolve its association.
    // SessionSync also refreshes after it establishes the server cookie.
    if (
      !ready ||
      !authenticated ||
      !stellarAddress ||
      (hasServerSession && hasServerWallet) ||
      refreshRequested.current
    )
      return;
    refreshRequested.current = true;
    router.refresh();
  }, [ready, authenticated, stellarAddress, hasServerSession, hasServerWallet, router]);

  if (!ready) return <Spinner />;

  if (!authenticated) {
    return (
      <Shell>
        <Card className="mx-auto max-w-lg border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
            <Sparkle width={24} height={24} />
          </span>
          <h1 className="font-display text-2xl font-bold text-white">Get started with Fondealo</h1>
          <p className="mt-2 text-sm text-slate-300">
            One login creates a real Stellar wallet for you — no seed phrase, no extension. It takes
            about ten seconds.
          </p>
          <Button onClick={login} size="lg" className="mt-6 w-full">
            Log in &amp; create my wallet
          </Button>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck width={14} height={14} />
            Powered by Privy · Stellar Testnet
          </div>
        </Card>
      </Shell>
    );
  }

  if (creatingWallet || !stellarAddress) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
          <p className="text-sm font-medium text-slate-200">Setting up your Stellar wallet…</p>
          {walletError ? (
            <p className="mt-2 text-xs text-red-400">{walletError} Try refreshing the page.</p>
          ) : null}
        </div>
      </Shell>
    );
  }

  if (accountServiceUnavailable) {
    return (
      <Shell>
        <Card className="mx-auto max-w-lg border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <h1 className="font-display text-xl font-bold text-white">Account setup is paused</h1>
          <p className="mt-2 text-sm text-slate-300">
            Your login succeeded, but we could not finish setting up your account right now. Your
            role has not been saved. Please try again shortly.
          </p>
          <Button variant="ghost-light" className="mt-6" onClick={() => router.refresh()}>
            Try again
          </Button>
        </Card>
      </Shell>
    );
  }

  if (!hasServerSession || !hasServerWallet) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg text-center" aria-live="polite">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-brand-400 motion-reduce:animate-none" />
          <h1 className="font-display text-xl font-semibold text-white">Verifying your account</h1>
          <p className="mt-2 text-sm text-slate-300">
            Your Stellar wallet is ready. We are confirming your secure session before you choose a
            role.
          </p>
          <Button variant="ghost-light" className="mt-6" onClick={() => router.refresh()}>
            Check again
          </Button>
        </div>
      </Shell>
    );
  }

  function pick(role: 'Business' | 'Investor') {
    setRoleError(null);
    startTransition(async () => {
      const result = await chooseRole(role);
      if (result?.error) setRoleError(result.error);
    });
  }

  const cards = [
    {
      role: 'Business' as const,
      icon: Building,
      title: 'I am a Business',
      body: 'Get your Passport, request USDC financing, and build a portable credit reputation.',
    },
    {
      role: 'Investor' as const,
      icon: Landmark,
      title: 'I am an Investor',
      body: 'Fund vetted SMEs scored by on-chain reputation and earn USDC returns.',
    },
  ];

  return (
    <Shell>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-white">One more step</h1>
        <p className="mt-2 text-slate-300">
          How do you want to use Fondealo? This decides which dashboard you land on — you can&apos;t
          switch later, so pick the one that matches you.
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-2xl gap-5 sm:grid-cols-2">
        {cards
          .slice()
          .sort((a, b) => (a.role === intent ? -1 : b.role === intent ? 1 : 0))
          .map((c) => (
            <button
              key={c.role}
              type="button"
              disabled={isPending}
              aria-pressed={selectedRole === c.role}
              onClick={() => {
                setSelectedRole(c.role);
                setRoleError(null);
              }}
              className={`group flex flex-col items-start rounded-2xl border bg-white/5 p-6 text-left backdrop-blur transition-colors hover:border-brand-400/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-60 ${selectedRole === c.role ? 'border-brand-400 bg-brand-500/10' : 'border-white/10'}`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
                <c.icon width={22} height={22} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-white">{c.title}</h2>
              <p className="mt-1.5 text-sm text-slate-300">{c.body}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-400">
                {selectedRole === c.role ? 'Selected' : 'Select role'}
                <ArrowRight width={16} height={16} />
              </span>
            </button>
          ))}
      </div>
      <div className="mx-auto mt-8 max-w-2xl text-center">
        <Button
          size="lg"
          disabled={!selectedRole || isPending}
          onClick={() => selectedRole && pick(selectedRole)}
        >
          {isPending
            ? 'Saving your role…'
            : selectedRole
              ? `Continue as ${selectedRole}`
              : 'Choose a role to continue'}
        </Button>
        <p className="mt-3 text-xs text-slate-400">
          Your role cannot be changed after confirmation.
        </p>
      </div>
      {roleError ? (
        <p className="mx-auto mt-6 max-w-md text-center text-sm text-red-400">{roleError}</p>
      ) : null}
    </Shell>
  );
}
