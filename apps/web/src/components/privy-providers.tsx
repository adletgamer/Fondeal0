'use client';

import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

/**
 * Privy is the login + wallet layer for the whole app: email/social login
 * creates a real Stellar keypair on first sign-in (Tier 2 support — see
 * apps/web/src/hooks/use-stellar-wallet.ts), no seed phrase for the user to
 * manage. /invest and /business are gated behind this (see AuthGate).
 *
 * Renders children un-wrapped when NEXT_PUBLIC_PRIVY_APP_ID isn't set yet
 * (e.g. before the Privy dashboard app is created) so the rest of the site
 * keeps working — AuthGate falls back to an explanatory screen in that case.
 */
export function PrivyProviders({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) return <>{children}</>;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#10b981',
          logo: undefined,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
