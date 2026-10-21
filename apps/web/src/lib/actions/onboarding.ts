'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@fondealo/database';
import { describeError, getSession } from '@/lib/auth/session';
import { INVESTOR_SIGNUP_ENABLED } from '@/lib/features';

const SECTION_FOR_ROLE = { Business: '/business', Investor: '/invest' } as const;

export type ChooseRoleResult = { error: string } | void;

/**
 * Onboarding state 4→5: persist the chosen role against the *verified*
 * session identity (never a client-supplied address) and redirect into the
 * matching section. Role is write-once — once set, resubmitting just
 * redirects to the existing section instead of overwriting it. Without that
 * guard, a Business user could call this action again with 'Investor' and
 * walk straight past the /invest role gate: that's the self-service
 * role-escalation path the security review flagged.
 *
 * Returns `{ error }` instead of redirecting back to /onboarding on failure
 * so the button click gives visible feedback — a silent redirect to the
 * page you're already on looks exactly like "nothing happened" or "it's
 * broken" from the UI, which is what made the original bug hard to see.
 */
export async function chooseRole(role: 'Business' | 'Investor'): Promise<ChooseRoleResult> {
  if (role !== 'Business' && role !== 'Investor') {
    return { error: 'Tipo de cuenta no válido.' };
  }

  const session = await getSession();
  if (!session) {
    return { error: 'Tu sesión expiró. Recarga la página e inicia sesión de nuevo.' };
  }

  if (session.role) {
    redirect(SECTION_FOR_ROLE[session.role]);
  }

  // Existing Investor accounts are redirected above; only new ones are refused.
  if (role === 'Investor' && !INVESTOR_SIGNUP_ENABLED) {
    return { error: 'Por ahora Fondealo solo acepta cuentas de empresa.' };
  }

  if (!session.stellarAddress) {
    // Privy reissues the identity token when a wallet is linked, but the
    // cookie our server reads can lag that by a moment (see
    // useStellarWallet's refreshUser() call) — this is the case that
    // refreshUser() is meant to prevent, kept as a clear message rather
    // than a silent bounce in case it still happens.
    return {
      error: 'Tu cuenta aún se está configurando. Espera unos segundos e inténtalo de nuevo.',
    };
  }

  let updatedCount: number;
  try {
    // Conditional (role: null) update so "write once" is enforced by the
    // database, not by the read-then-write above — two tabs or a double
    // click can't land two different roles, and whichever request commits
    // first wins for good.
    const result = await prisma.userWallet.updateMany({
      where: { privyUserId: session.privyUserId, role: null },
      data: { role },
    });
    updatedCount = result.count;
  } catch (err) {
    console.error('[chooseRole] could not persist role:', describeError(err));
    return { error: 'No pudimos guardar tu tipo de cuenta. Inténtalo de nuevo.' };
  }

  if (updatedCount === 0) {
    // Someone (this user, another tab) already set a role between our
    // getSession() read and now — honour the persisted one.
    const fresh = await prisma.userWallet.findUnique({
      where: { privyUserId: session.privyUserId },
    });
    if (fresh?.role) redirect(SECTION_FOR_ROLE[fresh.role]);
    return {
      error: 'No pudimos guardar tu tipo de cuenta. Recarga la página e inténtalo de nuevo.',
    };
  }

  redirect(SECTION_FOR_ROLE[role]);
}
