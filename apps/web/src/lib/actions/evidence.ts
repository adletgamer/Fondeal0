'use server';

import { prisma } from '@fondealo/database';
import { getSession } from '@/lib/auth/session';

export type EvidenceListResult =
  { ok: true; items: { kind: string; status: string }[] } | { ok: false; error: string };

/** Owner-only metadata read. Never returns private storage keys or document URLs. */
export async function listDeclaredEvidence(submissionId: string): Promise<EvidenceListResult> {
  const session = await getSession();
  if (!session?.stellarAddress || session.role !== 'Business') {
    return { ok: false, error: 'Business sign-in is required.' };
  }
  if (!/^[a-z0-9_-]{1,64}$/i.test(submissionId)) {
    return { ok: false, error: 'Invalid application reference.' };
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const submission = await tx.kybSubmission.findFirst({
        where: { id: submissionId, business: { stellarAddress: session.stellarAddress! } },
        select: { id: true, businessId: true },
      });
      if (!submission) return { ok: false as const, error: 'Application not found.' };
      const items = await tx.evidenceReference.findMany({
        where: { kybSubmissionId: submission.id, businessId: submission.businessId },
        select: { kind: true, status: true },
      });
      await tx.verificationAuditEvent.create({
        data: {
          businessId: submission.businessId,
          kybSubmissionId: submission.id,
          actorPrivyUserId: session.privyUserId,
          action: 'EvidenceMetadataViewed',
          metadata: {},
        },
      });
      return { ok: true as const, items };
    });
  } catch {
    return { ok: false, error: 'Evidence is temporarily unavailable.' };
  }
}
