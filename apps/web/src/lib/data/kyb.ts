import { prisma } from '@fondealo/database';
import { describeError } from '@/lib/auth/session';
import { canRequestFinancing } from '@/lib/underwriting/eligibility';

export interface KybState {
  status: 'None' | 'Accepted' | 'Rejected' | 'Processing';
  legalName: string | null;
  country: string | null;
  sector: string | null;
  providerRef: string | null;
  provider: string | null;
  reviewedAt: string | null;
  underwritingStatus: 'Review' | 'Approved' | 'Declined' | null;
  eligible: boolean;
}

const NONE: KybState = {
  status: 'None',
  legalName: null,
  country: null,
  sector: null,
  providerRef: null,
  provider: null,
  reviewedAt: null,
  underwritingStatus: null,
  eligible: false,
};

/** The business's latest KYB decision, or `null` if the database can't be reached. */
export async function getKybState(address: string): Promise<KybState | null> {
  try {
    const business = await prisma.business.findUnique({
      where: { stellarAddress: address },
      include: {
        kybSubmissions: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
        underwritingDecisions: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
        passport: true,
      },
    });
    const latest = business?.kybSubmissions[0];
    if (!business || !latest) return NONE;
    const decision = business.underwritingDecisions[0] ?? null;
    return {
      status: latest.status,
      legalName: business.legalName,
      country: business.country,
      sector: business.sector,
      providerRef: latest.providerRef,
      provider: latest.provider,
      reviewedAt: latest.reviewedAt?.toISOString() ?? null,
      underwritingStatus: decision?.kybSubmissionId === latest.id ? decision.status : null,
      eligible: canRequestFinancing({
        kyb: latest,
        decision,
        passport: business.passport,
        amountStroops: 1n,
        termDays: 1,
        now: new Date(),
      }),
    };
  } catch (err) {
    console.error('[kyb] getKybState failed:', describeError(err));
    return null;
  }
}
