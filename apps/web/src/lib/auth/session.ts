import { cache } from 'react';
import { cookies } from 'next/headers';
import { PrivyClient } from '@privy-io/server-auth';
import { prisma } from '@fondealo/database';
import type { UserRole } from '@fondealo/database';
import { SESSION_COOKIE_NAME } from './session-cookie';

export { SESSION_COOKIE_NAME };

/**
 * Server-verified identity. Never trust a client-supplied address (query
 * param, form field) for "whose dashboard is this" — that was an IDOR
 * waiting to happen (anyone could open `/business?address=someone-else`).
 * The one legitimate source of truth is the Privy **access token** held in our
 * own httpOnly cookie, verified against Privy's signing key on every read and
 * cross-referenced with our `UserWallet` row for the role chosen at onboarding.
 *
 * Why the access token and not the identity token: the identity token only
 * exists when "Identity tokens" is switched on in the Privy dashboard, and with
 * it off `useIdentityToken()` is `null` forever — no cookie was ever set and
 * every user saw "Your session expired". The access token is always issued.
 * The Stellar address is not in it, so it is fetched once per user with
 * `getUserById` (first login only) and then read from our own database.
 *
 * `<SessionSync>` reads the access token client-side and hands it to
 * `syncSession()` (apps/web/src/lib/actions/session.ts), which verifies it and
 * sets the cookie.
 */
export interface Session {
  privyUserId: string;
  stellarAddress: string | null;
  role: UserRole | null;
}

export function privyClient(): PrivyClient | null {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) return null;
  return new PrivyClient(appId, appSecret);
}

export function describeError(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  const msg = e?.message ?? String(err);
  return `${e?.code ? `[${e.code}] ` : ''}${msg}`.slice(0, 300);
}

function extractStellarAddress(user: { linkedAccounts: unknown[] }): string | null {
  const account = user.linkedAccounts.find(
    (a) => (a as { chainType?: string }).chainType === 'stellar',
  );
  return (account as { address?: string } | undefined)?.address ?? null;
}

/**
 * Verifies the session cookie and returns the caller's identity, or `null` if
 * there is no valid session. Persists a `UserWallet` row so the role chosen at
 * onboarding survives.
 *
 * Wrapped in React's `cache()` so a layout's role check and its page's own
 * call to this (both on the same request) verify the token and hit the
 * database once, not twice.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const client = privyClient();
  if (!client) {
    console.error('[session] NEXT_PUBLIC_PRIVY_APP_ID / PRIVY_APP_SECRET are not set');
    return null;
  }

  const jar = await cookies();
  const accessToken = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!accessToken) return null;

  let privyUserId: string;
  try {
    privyUserId = (await client.verifyAuthToken(accessToken)).userId;
  } catch (err) {
    // Expired or tampered-with token — expected now and then; the client re-syncs.
    console.error('[session] token verification failed:', describeError(err));
    return null;
  }

  try {
    return await resolveWallet(client, privyUserId);
  } catch (err) {
    // A unique-constraint conflict here almost always means a concurrent
    // first-login request (two tabs, or SessionSync racing a navigation)
    // created the row a moment ago — re-read once before giving up.
    if (isUniqueConflict(err)) {
      try {
        return await resolveWallet(client, privyUserId);
      } catch (retryErr) {
        console.error('[session] resolveWallet retry failed:', describeError(retryErr));
      }
    } else {
      console.error('[session] resolveWallet failed:', describeError(err));
    }
    // Database or Privy API unreachable — fail closed on role (no cross-role
    // access by accident) but still report the verified identity.
    return { privyUserId, stellarAddress: null, role: null };
  }
});

/** How stale `lastLoginAt` may get before we spend a write refreshing it. */
const LAST_LOGIN_THROTTLE_MS = 60 * 60 * 1000;

function isUniqueConflict(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

/**
 * Reads (or lazily creates) the `UserWallet` row for a verified Privy user.
 * Returning users are served from the database alone (no Privy API call).
 * `upsert` instead of find-then-create so two concurrent first-login requests
 * can't both take the `create` branch; the caller retries once on the
 * unique-constraint race that can still slip through.
 */
async function resolveWallet(client: PrivyClient, privyUserId: string): Promise<Session> {
  const existing = await prisma.userWallet.findUnique({ where: { privyUserId } });

  if (existing) {
    const loginStale =
      !existing.lastLoginAt || Date.now() - existing.lastLoginAt.getTime() > LAST_LOGIN_THROTTLE_MS;
    if (loginStale) {
      await prisma.userWallet.update({ where: { privyUserId }, data: { lastLoginAt: new Date() } });
    }
    return { privyUserId, stellarAddress: existing.stellarAddress, role: existing.role };
  }

  const user = await client.getUserById(privyUserId);
  const stellarAddress = extractStellarAddress(user);
  if (!stellarAddress) {
    // Logged in, but the embedded Stellar wallet hasn't finished being
    // created yet (client-side useStellarWallet handles that) — nothing to
    // persist until it exists.
    return { privyUserId, stellarAddress: null, role: null };
  }

  const wallet = await prisma.userWallet.upsert({
    where: { privyUserId },
    create: { privyUserId, stellarAddress, lastLoginAt: new Date() },
    update: { lastLoginAt: new Date() },
  });
  return { privyUserId, stellarAddress: wallet.stellarAddress, role: wallet.role };
}
