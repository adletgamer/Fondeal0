'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useIdentityToken } from '@privy-io/react-auth';
import { syncSession, clearSession } from '@/lib/actions/session';

/**
 * Keeps our own server-readable session cookie (see
 * apps/web/src/lib/auth/session.ts) in step with Privy's client-side auth
 * state. Mounted once, app-wide, inside <PrivyProviders>.
 *
 * `identityToken` from useIdentityToken() changes on login, whenever a linked
 * account changes (e.g. the Stellar wallet finishes being created), and again
 * each time Privy silently refreshes the token (~hourly) while the tab is
 * open. Every change is pushed to the server via syncSession() so
 * getSession() never reads a cookie older than the user's actual state — and
 * a failed push is retried with backoff so a dropped request doesn't strand
 * the session until the next refresh an hour later.
 *
 * Recovery: when the page was server-rendered from a stale or missing cookie
 * (token expired while the tab was idle; first paint after a hard reload
 * right after login), the first sync of this mount that actually *moves* the
 * cookie is followed by `router.refresh()`, so the server components re-run
 * against the fresh cookie instead of leaving the user stranded on a
 * logged-out view or bounced to /onboarding.
 */
const MAX_SYNC_RETRIES = 4;
const RETRY_BASE_MS = 1000;

export function SessionSync() {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { identityToken } = useIdentityToken();
  const lastSynced = useRef<string | null>(null);
  const recoveredThisMount = useRef(false);

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      if (lastSynced.current !== null) {
        lastSynced.current = null;
        recoveredThisMount.current = false;
        void clearSession();
      }
      return;
    }

    if (!identityToken || identityToken === lastSynced.current) return;

    let cancelled = false;
    const token = identityToken;
    const isFirstSyncOfMount = lastSynced.current === null;

    const push = async (attempt: number): Promise<void> => {
      const { ok, changed } = await syncSession(token).catch(() => ({
        ok: false,
        changed: false,
      }));
      if (cancelled) return;
      if (ok) {
        lastSynced.current = token;
        // Only re-run the server render when the cookie genuinely moved and
        // this is the first sync since the page loaded — i.e. a login or an
        // expiry recovery, not an hourly token rotation on a page that's
        // already authenticated.
        if (changed && isFirstSyncOfMount && !recoveredThisMount.current) {
          recoveredThisMount.current = true;
          router.refresh();
        }
        return;
      }
      if (attempt < MAX_SYNC_RETRIES) {
        const wait = RETRY_BASE_MS * 2 ** attempt;
        window.setTimeout(() => {
          if (!cancelled) void push(attempt + 1);
        }, wait);
      }
    };

    void push(0);

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, identityToken, router]);

  return null;
}
