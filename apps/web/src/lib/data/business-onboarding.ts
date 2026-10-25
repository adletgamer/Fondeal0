import { prisma } from '@fondealo/database';
import {
  businessFinancingProfileSchema,
  BUSINESS_FINANCING_PROFILE_VERSION,
} from '@fondealo/types';
import type { Session } from '@/lib/auth/session';
import type { BusinessOnboardingState } from '@/lib/business-profile';

/** Only a verified, persisted Business session can resolve its own profile. */
export async function getBusinessOnboardingState(
  session: Session | null,
): Promise<BusinessOnboardingState> {
  if (!session?.stellarAddress || session.role !== 'Business')
    return { kind: 'UNAVAILABLE', initial: null };
  try {
    const business = await prisma.business.findUnique({
      where: { stellarAddress: session.stellarAddress },
      select: {
        legalName: true,
        country: true,
        sector: true,
        foundedYear: true,
        revenueBand: true,
        financingProfile: true,
        _count: { select: { kybSubmissions: true } },
      },
    });
    if (!business) return { kind: 'NO_BUSINESS', initial: null };
    const p = business.financingProfile;
    const parsed = p
      ? businessFinancingProfileSchema.safeParse({
          primaryCashFlowType: p.primaryCashFlowType,
          financingUseCase: p.financingUseCase,
          requestedAmountBand: p.requestedAmountBand,
          preferredTermBand: p.preferredTermBand,
          b2bShareBand: p.b2bShareBand,
        })
      : null;
    const complete = Boolean(
      p?.completedAt && p.profileVersion === BUSINESS_FINANCING_PROFILE_VERSION && parsed?.success,
    );
    return {
      kind: complete
        ? p!.primaryCashFlowType === 'PRE_REVENUE'
          ? 'PRE_REVENUE'
          : 'PROFILE_COMPLETE'
        : 'PROFILE_INCOMPLETE',
      initial: {
        legalName: business.legalName,
        country: business.country,
        sector: business.sector ?? '',
        foundedYear: business.foundedYear,
        revenueBand: business.revenueBand,
        profile: parsed?.success ? parsed.data : null,
        identityLocked: business._count.kybSubmissions > 0,
      },
    };
  } catch {
    // An unavailable/missing profile table must not lock existing users out of /business.
    return { kind: 'UNAVAILABLE', initial: null };
  }
}
