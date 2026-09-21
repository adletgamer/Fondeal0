'use server';

import { cookies } from 'next/headers';
import { describeError, privyClient } from '@/lib/auth/session';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-cookie';

/**
 * Called by <SessionSync> (apps/web/src/components/session-sync.tsx) with the
 * client's Privy access token — right after login and again whenever Privy
 * refreshes it. Verifies the token's signature before trusting it, then stores
 * it as our own httpOnly cookie so every later Server Component / Server
 * Action can read `getSession()` without depending on Privy's own cookie.
 *
 * `changed` reports whether the cookie actually moved (was absent, or held a
 * different token). <SessionSync> uses it to decide whether the page it's
 * mounted on was server-rendered from a stale/missing cookie and needs a
 * `router.refresh()` — that's what turns "token expired while the tab sat
 * idle → bounced to /onboarding and stuck" into a transparent recovery.
 */
export async function syncSession(accessToken: string): Promise<{ ok: boolean; changed: boolean }> {
  const client = privyClient();
  if (!client) {
    console.error('[syncSession] NEXT_PUBLIC_PRIVY_APP_ID / PRIVY_APP_SECRET are not set');
    return { ok: false, changed: false };
  }

  try {
    await client.verifyAuthToken(accessToken);
  } catch (err) {
    console.error('[syncSession] token verification failed:', describeError(err));
    return { ok: false, changed: false };
  }

  const jar = await cookies();
  const changed = jar.get(SESSION_COOKIE_NAME)?.value !== accessToken;
  jar.set(SESSION_COOKIE_NAME, accessToken, {
    httpOnly: true,
    // `secure` cookies are dropped by browsers over plain HTTP — would
    // silently break this on http://localhost:3000 during local dev.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // The access token itself expires (~1h) well before this; it is
    // re-verified on every read, so this is just how long a stale cookie can linger.
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true, changed };
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}
