'use client';

import { useEffect, useRef } from 'react';
import { usePrivy, useIdentityToken } from '@privy-io/react-auth';
import { syncSession, clearSession } from '@/lib/actions/session';

/**
 * Keeps our own server-readable session cookie (see
 * apps/web/src/lib/auth/session.ts) in step with Privy's client-side auth
 * state. Mounted once, app-wide, inside <PrivyProviders>.
 *
 * `identityToken` from useIdentityToken() changes on login and again
 * whenever a linked account changes (e.g. the Stellar wallet finishes being
 * created) — each change gets pushed to the server via syncSession() so
 * getSession() never reads a cookie older than the user's actual state.
 */
export function SessionSync() {
  const { authenticated, ready } = usePrivy();
  const { identityToken } = useIdentityToken();
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      if (lastSynced.current !== null) {
        lastSynced.current = null;
        clearSession();
      }
      return;
    }

    if (!identityToken || identityToken === lastSynced.current) return;
    lastSynced.current = identityToken;
    syncSession(identityToken);
  }, [ready, authenticated, identityToken]);

  return null;
}
