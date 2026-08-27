'use client';

import { Suspense, useTransition, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
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
export function OnboardingFlow() {
  if (!PRIVY_CONFIGURED) {
    return (
      <Shell>
        <Card className="mx-auto max-w-lg border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <h1 className="font-display text-xl font-bold text-white">Login not configured yet</h1>
          <p className="mt-2 text-sm text-slate-300">
            Set <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_PRIVY_APP_ID</code>{' '}
            and <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">PRIVY_APP_SECRET</code> to enable
            login.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Suspense fallback={<Spinner />}>
      <ConnectedOnboarding />
    </Suspense>
  );
}

function ConnectedOnboarding() {
  const wallet = useStellarWallet();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent') === 'invest' ? 'Investor' : 'Business';
  return <OnboardingContent wallet={wallet} intent={intent} />;
}

function OnboardingContent({
  wallet,
  intent,
}: {
  wallet: StellarWalletState;
  intent: 'Business' | 'Investor';
}) {
  const { ready, authenticated, stellarAddress, creatingWallet, walletError, login } = wallet;
  const [isPending, startTransition] = useTransition();

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

  function pick(role: 'Business' | 'Investor') {
    startTransition(() => {
      chooseRole(role);
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
              onClick={() => pick(c.role)}
              className="group flex flex-col items-start rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur transition-colors hover:border-brand-400/50 hover:bg-white/10 disabled:opacity-60"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
                <c.icon width={22} height={22} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-white">{c.title}</h2>
              <p className="mt-1.5 text-sm text-slate-300">{c.body}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-400">
                Continue
                <ArrowRight width={16} height={16} />
              </span>
            </button>
          ))}
      </div>
    </Shell>
  );
}
