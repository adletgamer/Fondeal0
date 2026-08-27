import { cache } from 'react';
import { cookies } from 'next/headers';
import { PrivyClient } from '@privy-io/server-auth';
import { prisma } from '@fondealo/database';
import type { UserRole } from '@fondealo/database';

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

function privyClient(): PrivyClient | null {
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
  const idToken = jar.get('privy-id-token')?.value;
  if (!idToken) return null;

  let user;
  try {
    user = await client.getUser({ idToken });
  } catch {
    return null; // missing, expired, or tampered-with token
  }

  const tokenAddress = extractStellarAddress(user);

  try {
    const existing = await prisma.userWallet.findUnique({ where: { privyUserId: user.id } });
    if (existing) {
      const stellarAddress = tokenAddress ?? existing.stellarAddress;
      if (tokenAddress && tokenAddress !== existing.stellarAddress) {
        await prisma.userWallet.update({
          where: { privyUserId: user.id },
          data: { stellarAddress: tokenAddress, lastLoginAt: new Date() },
        });
      } else {
        await prisma.userWallet.update({
          where: { privyUserId: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
      return { privyUserId: user.id, stellarAddress, role: existing.role };
    }

    if (!tokenAddress) {
      // Logged in, but the embedded Stellar wallet hasn't finished being
      // created yet (client-side useStellarWallet handles that) — nothing
      // to persist until it exists.
      return { privyUserId: user.id, stellarAddress: null, role: null };
    }

    const created = await prisma.userWallet.create({
      data: { privyUserId: user.id, stellarAddress: tokenAddress },
    });
    return { privyUserId: user.id, stellarAddress: created.stellarAddress, role: created.role };
  } catch {
    // Database unreachable — fail closed on role (no cross-role access by
    // accident) but still report identity from the verified token alone.
    return { privyUserId: user.id, stellarAddress: tokenAddress, role: null };
  }
});
