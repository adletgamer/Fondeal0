'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@fondealo/database';
import { BUSINESS_FINANCING_PROFILE_VERSION } from '@fondealo/types';
import { getSession } from '@/lib/auth/session';
import { businessProfileInputSchema } from '@/lib/business-profile';
import { getAppTranslator } from '@/lib/app-locale';

export type SaveBusinessProfileResult = { ok: true } | { ok: false; error: string };

export async function saveBusinessProfile(input: unknown): Promise<SaveBusinessProfileResult> {
  const session = await getSession();
  const t = await getAppTranslator();
  if (!session?.stellarAddress || session.role !== 'Business') {
    return { ok: false, error: t('Sign in with your business account to continue.') };
  }
  const parsed = businessProfileInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: t('Review your company details and complete the required ranges.') };
  const d = parsed.data;
  try {
    await prisma.$transaction(
      async (tx) => {
        const existing = await tx.business.findUnique({
          where: { stellarAddress: session.stellarAddress! },
          select: {
            id: true,
            legalName: true,
            country: true,
            sector: true,
            foundedYear: true,
            revenueBand: true,
            _count: { select: { kybSubmissions: true } },
          },
        });
        const locked = Boolean(existing && existing._count.kybSubmissions > 0);
        if (
          locked &&
          (existing!.legalName !== d.legalName ||
            existing!.country !== d.country ||
            (existing!.sector !== null && existing!.sector !== d.sector) ||
            (existing!.foundedYear !== null && existing!.foundedYear !== d.foundedYear) ||
            (existing!.revenueBand !== null && existing!.revenueBand !== d.revenueBand))
        )
          throw new Error('IDENTITY_LOCKED');
        const details = {
          legalName: d.legalName,
          country: d.country,
          sector: d.sector,
          foundedYear: d.foundedYear,
          revenueBand: d.revenueBand,
        };
        const business = existing
          ? await tx.business.update({
              where: { id: existing.id },
              data: details,
              select: { id: true },
            })
          : await tx.business.create({
              data: { ...details, stellarAddress: session.stellarAddress! },
              select: { id: true },
            });
        const profile = {
          ...d.profile,
          profileVersion: BUSINESS_FINANCING_PROFILE_VERSION,
          completedAt: new Date(),
        };
        await tx.businessFinancingProfile.upsert({
          where: { businessId: business.id },
          create: { businessId: business.id, ...profile },
          update: profile,
        });
        await tx.businessProfileEvent.create({
          data: { businessId: business.id, actorPrivyUserId: session.privyUserId, action: 'Saved' },
        });
        // No KYB submission, decision, score, Passport, role or ledger mutation occurs here.
      },
      { isolationLevel: 'Serializable' },
    );
  } catch (error) {
    return {
      ok: false,
      error: t(
        error instanceof Error && error.message === 'IDENTITY_LOCKED'
          ? 'Company identity is already part of a verification request. Contact support to change it.'
          : 'We could not save your profile. Please try again; your account access is unchanged.',
      ),
    };
  }
  revalidatePath('/business');
  revalidatePath('/business/onboarding');
  revalidatePath('/business/datos');
  return { ok: true };
}
