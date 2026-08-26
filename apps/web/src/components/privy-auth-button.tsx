'use client';

import { Button } from '@fondealo/ui';
import { useStellarWallet } from '@/hooks/use-stellar-wallet';
import { Wallet } from './icons';

const PRIVY_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

/** Landing-page auth entry point: same Privy login used to gate /invest and /business. */
export function PrivyAuthButton({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  if (!PRIVY_CONFIGURED) {
    return (
      <Button variant="dark" size={size} disabled title="Set NEXT_PUBLIC_PRIVY_APP_ID to enable login">
        <Wallet width={16} height={16} />
        Log in
      </Button>
    );
  }
  return <PrivyAuthButtonInner size={size} />;
}

function PrivyAuthButtonInner({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const { ready, authenticated, stellarAddress, login, logout } = useStellarWallet();

  if (!ready) {
    return (
      <Button variant="dark" size={size} disabled>
        <Wallet width={16} height={16} />
        …
      </Button>
    );
  }

  if (authenticated) {
    return (
      <button
        type="button"
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 font-mono text-xs text-brand-800 transition-colors hover:border-brand-300"
        title="Log out"
      >
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        {stellarAddress ? `${stellarAddress.slice(0, 5)}…${stellarAddress.slice(-5)}` : 'Setting up…'}
      </button>
    );
  }

  return (
    <Button variant="dark" size={size} onClick={login}>
      <Wallet width={16} height={16} />
      Log in
    </Button>
  );
}
