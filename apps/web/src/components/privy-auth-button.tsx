'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AddressChip, Button } from '@fondealo/ui';
import { useStellarWallet } from '@/hooks/use-stellar-wallet';
import { Wallet } from './icons';

const PRIVY_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

/** Landing-page auth entry point: same Privy login used to gate /invest and /business. */
export function PrivyAuthButton({
  size = 'sm',
  enterAppOnLogin = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  enterAppOnLogin?: boolean;
}) {
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
  return <PrivyAuthButtonInner size={size} enterAppOnLogin={enterAppOnLogin} />;
}

function PrivyAuthButtonInner({
  size,
  enterAppOnLogin,
}: {
  size: 'sm' | 'md' | 'lg';
  enterAppOnLogin: boolean;
}) {
  const router = useRouter();
  const { ready, authenticated, stellarAddress, login, logout } = useStellarWallet();
  const loginRequested = useRef(false);

  useEffect(() => {
    if (enterAppOnLogin && authenticated && loginRequested.current) {
      loginRequested.current = false;
      // Onboarding performs the server-side role decision after SessionSync
      // establishes the verified cookie. Never infer a destination here.
      router.push('/onboarding');
    }
  }, [authenticated, enterAppOnLogin, router]);

  if (!ready) {
    return (
      <Button variant="dark" size={size} disabled>
        <Wallet width={16} height={16} />…
      </Button>
    );
  }

  if (authenticated) {
    if (enterAppOnLogin) {
      return (
        <Button variant="dark" size={size} onClick={() => router.push('/onboarding')}>
          Open app
        </Button>
      );
    }
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
    <Button
      variant="dark"
      size={size}
      onClick={() => {
        loginRequested.current = true;
        login();
      }}
    >
      <Wallet width={16} height={16} />
      Log in
    </Button>
  );
}
