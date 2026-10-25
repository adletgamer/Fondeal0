'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@fondealo/database';
import { describeError, getSession } from '@/lib/auth/session';
import { formatDateLima } from '@/lib/format';

export type DataRightsResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Records the owner's request to delete their business data (and withdraw
 * consent). It only appends an audit event: there is no automated deletion,
 * because retention and deletion rules still need legal review (ADR-0010).
 * Idempotent — a second request reports the first one.
 */
export async function requestDataDeletion(
  _prev: DataRightsResult | null,
  _formData: FormData,
): Promise<DataRightsResult> {
  const session = await getSession();
  if (!session?.stellarAddress || session.role !== 'Business') {
    return {
      ok: false,
      error: 'Inicia sesión con tu cuenta de empresa para hacer esta solicitud.',
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.findUnique({
        where: { stellarAddress: session.stellarAddress! },
        select: {
          id: true,
          financingProfile: { select: { businessId: true } },
          kybSubmissions: {
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 1,
            select: { id: true },
          },
        },
      });
      const submission = business?.kybSubmissions[0];
      if (!business) return { kind: 'nothing' as const };
      if (!submission && business.financingProfile) {
        const existing = await tx.businessProfileEvent.findFirst({
          where: { businessId: business.id, action: 'DeletionRequested' },
          select: { createdAt: true },
        });
        if (existing) return { kind: 'already' as const, at: existing.createdAt };
        await tx.businessProfileEvent.create({
          data: {
            businessId: business.id,
            actorPrivyUserId: session.privyUserId,
            action: 'DeletionRequested',
          },
        });
        return { kind: 'recorded' as const };
      }
      if (!submission) return { kind: 'nothing' as const };

      const existing = await tx.verificationAuditEvent.findFirst({
        where: { businessId: business.id, action: 'DeletionRequested' },
        select: { createdAt: true },
      });
      if (existing) return { kind: 'already' as const, at: existing.createdAt };

      await tx.verificationAuditEvent.create({
        data: {
          businessId: business.id,
          kybSubmissionId: submission.id,
          actorPrivyUserId: session.privyUserId,
          action: 'DeletionRequested',
          metadata: { scope: 'business-data' },
        },
      });
      return { kind: 'recorded' as const };
    });

    if (result.kind === 'nothing') {
      return { ok: false, error: 'No tenemos datos de una empresa asociados a tu cuenta.' };
    }
    revalidatePath('/business/datos');
    if (result.kind === 'already') {
      return {
        ok: true,
        message: `Ya registramos tu solicitud el ${formatDateLima(result.at)}.`,
      };
    }
    return { ok: true, message: 'Registramos tu solicitud de eliminación.' };
  } catch (err) {
    console.error('[requestDataDeletion] failed:', describeError(err));
    return { ok: false, error: 'No pudimos registrar tu solicitud. Inténtalo de nuevo.' };
  }
}
