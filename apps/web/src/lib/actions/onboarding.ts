'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@fondealo/database';
import { getSession } from '@/lib/auth/session';

const SECTION_FOR_ROLE = { Business: '/business', Investor: '/invest' } as const;

/**
 * Onboarding state 4→5: persist the chosen role against the *verified*
 * session identity (never a client-supplied address) and redirect into the
 * matching section. Role is write-once — once set, resubmitting just
 * redirects to the existing section instead of overwriting it. Without that
 * guard, a Business user could call this action again with 'Investor' and
 * walk straight past the /invest role gate: that's the self-service
 * role-escalation path the security review flagged.
 */
export async function chooseRole(role: 'Business' | 'Investor'): Promise<void> {
  if (role !== 'Business' && role !== 'Investor') {
    redirect('/onboarding');
  }

  const session = await getSession();
  if (!session) {
    redirect('/onboarding');
  }

  if (session.role) {
    redirect(SECTION_FOR_ROLE[session.role]);
  }

  if (!session.stellarAddress) {
    // No UserWallet row exists yet (wallet creation hasn't finished/persisted
    // client-side) — nothing to attach the role to.
    redirect('/onboarding');
  }

  await prisma.userWallet.update({
    where: { privyUserId: session.privyUserId },
    data: { role },
  });

  redirect(SECTION_FOR_ROLE[role]);
}
