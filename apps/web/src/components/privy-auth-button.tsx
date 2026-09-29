'use client';

import { AddressChip, Button } from '@fondealo/ui';
import { useStellarWallet } from '@/hooks/use-stellar-wallet';
import { Wallet } from './icons';

const PRIVY_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

/** Landing-page auth entry point: same Privy login used to gate /invest and /business. */
export function PrivyAuthButton({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  if (!PRIVY_CONFIGURED) {
    return (
      <Button
        variant="dark"
        size={size}
        disabled
        title="Set NEXT_PUBLIC_PRIVY_APP_ID to enable login"
      >
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
        <Wallet width={16} height={16} />…
      </Button>
    );
  }

  if (authenticated) {
    if (!stellarAddress) {
      return (
        <Button variant="secondary" size={size} disabled>
          Setting up…
        </Button>
      );
    }
    return (
      <AddressChip
        address={stellarAddress}
        onClick={logout}
        title={`${stellarAddress} — click to log out`}
        aria-label={`Log out of ${stellarAddress}`}
      />
    );
  }

  return (
    <Button variant="dark" size={size} onClick={login}>
      <Wallet width={16} height={16} />
      Log in
    </Button>
  );
}
