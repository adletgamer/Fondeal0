import { prisma } from '@fondealo/database';
import { describeError } from '@/lib/auth/session';

export interface KybState {
  status: 'None' | 'Accepted' | 'Rejected' | 'Processing';
  legalName: string | null;
  country: string | null;
  providerRef: string | null;
  reviewedAt: string | null;
}

const NONE: KybState = {
  status: 'None',
  legalName: null,
  country: null,
  providerRef: null,
  reviewedAt: null,
};

/** The business's latest KYB decision, or `null` if the database can't be reached. */
export async function getKybState(address: string): Promise<KybState | null> {
  try {
    const business = await prisma.business.findUnique({
      where: { stellarAddress: address },
      include: { kybSubmissions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const latest = business?.kybSubmissions[0];
    if (!business || !latest) return NONE;
    return {
      status: latest.status,
      legalName: business.legalName,
      country: business.country,
      providerRef: latest.providerRef,
      reviewedAt: latest.reviewedAt?.toISOString() ?? null,
    };
  } catch (err) {
    console.error('[kyb] getKybState failed:', describeError(err));
    return null;
  }
}
