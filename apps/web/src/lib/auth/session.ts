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
 * This is the one legitimate source of truth: Privy's signed session cookie,
 * verified locally (no network round-trip — `getUser({idToken})` checks the
 * JWT signature before parsing it), cross-referenced with our own
 * `UserWallet` row for the role chosen during onboarding.
 */
export interface Session {
  privyUserId: string;
  stellarAddress: string | null;
  role: UserRole | null;
}

/**
 * Our own cookie (name defined in ./session-cookie), not Privy's. Privy's
 * automatic `privy-id-token` cookie turned out to be unreliable here —
 * whether it's set at all depends on dashboard-side domain verification that
 * differs between dev and prod app tiers (see
 * docs/guide/react/configuration/cookies), and in practice it never showed
 * up on fondealo.vercel.app. Instead, `<SessionSync>` reads the identity
 * token client-side via `useIdentityToken()` — documented by Privy
 * specifically for "passing the identity token in your requests" — and hands
 * it to `syncSession()` (apps/web/src/lib/actions/session.ts), which verifies
 * it and sets this cookie itself. That makes session persistence entirely
 * our own responsibility instead of a guess about Privy's cookie behavior.
 */
export function privyClient(): PrivyClient | null {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) return null;
  return new PrivyClient(appId, appSecret);
}

function extractStellarAddress(user: { linkedAccounts: unknown[] }): string | null {
  const account = user.linkedAccounts.find(
    (a) => (a as { chainType?: string }).chainType === 'stellar',
  );
  return (account as { address?: string } | undefined)?.address ?? null;
}

/**
 * Verifies the Privy session cookie and returns the caller's identity, or
 * `null` if there is no valid session. Persists/refreshes a `UserWallet` row
 * so the role chosen at onboarding survives, and so later requests don't
 * need to re-derive the Stellar address from the (size-limited) ID token.
 *
 * Wrapped in React's `cache()` so a layout's role check and its page's own
 * call to this (both on the same request) verify the token and hit the
 * database once, not twice.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const client = privyClient();
  if (!client) return null;

  const jar = await cookies();
  const idToken = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!idToken) return null;

  let user;
  try {
    user = await client.getUser({ idToken });
  } catch {
    return null; // missing, expired, or tampered-with token
  }

  const tokenAddress = extractStellarAddress(user);

  try {
    return await resolveWallet(user.id, tokenAddress);
  } catch (err) {
    // A unique-constraint conflict here almost always means a concurrent
    // first-login request (two tabs, or SessionSync racing a navigation)
    // created the row a moment ago — re-read once before giving up.
    if (isUniqueConflict(err)) {
      try {
        return await resolveWallet(user.id, tokenAddress);
      } catch {
        /* fall through */
      }
    }
    // Database unreachable — fail closed on role (no cross-role access by
    // accident) but still report identity from the verified token alone.
    return { privyUserId: user.id, stellarAddress: tokenAddress, role: null };
  }
});

/** How stale `lastLoginAt` may get before we spend a write refreshing it. */
const LAST_LOGIN_THROTTLE_MS = 60 * 60 * 1000;

function isUniqueConflict(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

/**
 * Reads (or lazily creates) the `UserWallet` row for a verified Privy user.
 * `upsert` instead of find-then-create/update so two concurrent first-login
 * requests can't both take the `create` branch; the caller retries once on
 * the unique-constraint race that can still slip through.
 */
async function resolveWallet(privyUserId: string, tokenAddress: string | null): Promise<Session> {
  const existing = await prisma.userWallet.findUnique({ where: { privyUserId } });

  if (!existing && !tokenAddress) {
    // Logged in, but the embedded Stellar wallet hasn't finished being
    // created yet (client-side useStellarWallet handles that) — nothing to
    // persist until it exists.
    return { privyUserId, stellarAddress: null, role: null };
  }

  const addressChanged = Boolean(
    tokenAddress && existing && tokenAddress !== existing.stellarAddress,
  );
  const loginStale =
    !existing?.lastLoginAt || Date.now() - existing.lastLoginAt.getTime() > LAST_LOGIN_THROTTLE_MS;

  if (existing && !addressChanged && !loginStale) {
    return {
      privyUserId,
      stellarAddress: existing.stellarAddress,
      role: existing.role,
    };
  }

  const wallet = await prisma.userWallet.upsert({
    where: { privyUserId },
    create: { privyUserId, stellarAddress: tokenAddress as string, lastLoginAt: new Date() },
    update: {
      lastLoginAt: new Date(),
      ...(addressChanged ? { stellarAddress: tokenAddress as string } : {}),
    },
  });
  return { privyUserId, stellarAddress: wallet.stellarAddress, role: wallet.role };
}
