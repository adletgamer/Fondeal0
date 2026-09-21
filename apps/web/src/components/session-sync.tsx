'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { syncSession, clearSession } from '@/lib/actions/session';

/**
 * Keeps our own server-readable session cookie (see
 * apps/web/src/lib/auth/session.ts) in step with Privy's client-side auth
 * state. Mounted once, app-wide, inside <PrivyProviders>.
 *
 * It syncs Privy's **access token** (always issued, unlike the identity token
 * which needs a dashboard toggle): once as soon as the user is authenticated,
 * then every few minutes — `getAccessToken()` silently refreshes the token when
 * it is close to expiry, so a changed value is pushed to the server before the
 * cookie goes stale. A failed push is retried with backoff.
 *
 * Recovery: when the page was server-rendered from a stale or missing cookie
 * (token expired while the tab was idle; first paint right after login), the
 * first sync of this mount that actually *moves* the cookie is followed by
 * `router.refresh()`, so the server components re-run against the fresh cookie
 * instead of leaving the user stranded on a logged-out view.
 */
const MAX_SYNC_RETRIES = 4;
const RETRY_BASE_MS = 1000;
const REFRESH_INTERVAL_MS = 4 * 60 * 1000;

export function SessionSync() {
  const router = useRouter();
  const { authenticated, ready, getAccessToken } = usePrivy();
  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;
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

    let cancelled = false;
    const timers = new Set<number>();

    const retryLater = (attempt: number) => {
      if (attempt >= MAX_SYNC_RETRIES) return;
      const id = window.setTimeout(
        () => {
          timers.delete(id);
          if (!cancelled) void push(attempt + 1);
        },
        RETRY_BASE_MS * 2 ** attempt,
      );
      timers.add(id);
    };

    const push = async (attempt: number): Promise<void> => {
      const token = await getAccessTokenRef.current().catch(() => null);
      if (cancelled) return;
      if (!token) return retryLater(attempt);
      if (token === lastSynced.current) return;

      const isFirstSyncOfMount = lastSynced.current === null;
      const { ok, changed } = await syncSession(token).catch(() => ({
        ok: false,
        changed: false,
      }));
      if (cancelled) return;
      if (!ok) return retryLater(attempt);

      lastSynced.current = token;
      // Only re-run the server render when the cookie genuinely moved and this
      // is the first sync since the page loaded — i.e. a login or an expiry
      // recovery, not a routine token rotation on an already-authenticated page.
      if (changed && isFirstSyncOfMount && !recoveredThisMount.current) {
        recoveredThisMount.current = true;
        router.refresh();
      }
    };

    void push(0);
    const interval = window.setInterval(() => void push(0), REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [ready, authenticated, router]);

  return null;
}
