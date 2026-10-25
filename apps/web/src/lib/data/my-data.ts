import { prisma } from '@fondealo/database';
import { describeError, privyClient } from '@/lib/auth/session';

export interface MyDataOverview {
  financingProfile?: {
    primaryCashFlowType: string;
    financingUseCase: string | null;
    requestedAmountBand: string | null;
    preferredTermBand: string | null;
    b2bShareBand: string | null;
    completedAt: string | null;
  } | null;
  business: {
    legalName: string;
    country: string;
    taxId: string | null;
    sector: string | null;
    foundedYear: number | null;
    revenueBand: string | null;
    email: string | null;
  } | null;
  representative: { name: string | null; relationship: string | null } | null;
  declaredEvidence: string[];
  consent: { version: string | null; at: string | null } | null;
  deletionRequestedAt: string | null;
}

/** One audit row per viewer per window is enough to show who read the data and when. */
const VIEW_AUDIT_WINDOW_MS = 10 * 60 * 1000;

const EMPTY: MyDataOverview = {
  business: null,
  representative: null,
  declaredEvidence: [],
  consent: null,
  deletionRequestedAt: null,
};

function stringField(fields: unknown, key: string): string | null {
  if (!fields || typeof fields !== 'object') return null;
  const value = (fields as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

/**
 * The owner's own view of what Fondealo stores about their business. The
 * read is audited (ADR-0010: sensitive reads are logged) in the same
 * transaction, so an unaudited read never reaches the page. Returns `null`
 * when the database or audit log can't be reached. Never returns the
 * commitment salt, provider references or storage keys.
 */
export async function getMyData(
  address: string,
  actorPrivyUserId: string,
): Promise<MyDataOverview | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      const business = await tx.business.findUnique({
        where: { stellarAddress: address },
        include: {
          financingProfile: true,
          profileEvents: {
            where: { action: 'DeletionRequested' },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
          kybSubmissions: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
          verificationAuditEvents: {
            where: { action: 'DeletionRequested' },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      });
      const latest = business?.kybSubmissions[0];
      if (!business) return EMPTY;

      const profile = business.financingProfile;
      if (profile) {
        await tx.businessProfileEvent.create({
          data: { businessId: business.id, actorPrivyUserId, action: 'Viewed' },
        });
      }

      const evidence = latest
        ? await tx.evidenceReference.findMany({
            where: { kybSubmissionId: latest.id, businessId: business.id },
            select: { kind: true },
          })
        : [];
      const recentView = latest
        ? await tx.verificationAuditEvent.findFirst({
            where: {
              businessId: business.id,
              actorPrivyUserId,
              action: 'DataOverviewViewed',
              createdAt: { gte: new Date(Date.now() - VIEW_AUDIT_WINDOW_MS) },
            },
            select: { id: true },
          })
        : null;
      if (latest && !recentView) {
        await tx.verificationAuditEvent.create({
          data: {
            businessId: business.id,
            kybSubmissionId: latest.id,
            actorPrivyUserId,
            action: 'DataOverviewViewed',
            metadata: {},
          },
        });
      }

      return {
        financingProfile: profile
          ? {
              primaryCashFlowType: profile.primaryCashFlowType,
              financingUseCase: profile.financingUseCase,
              requestedAmountBand: profile.requestedAmountBand,
              preferredTermBand: profile.preferredTermBand,
              b2bShareBand: profile.b2bShareBand,
              completedAt: profile.completedAt?.toISOString() ?? null,
            }
          : null,
        business: {
          legalName: business.legalName,
          country: business.country,
          taxId: business.taxId,
          sector: business.sector,
          foundedYear: business.foundedYear,
          revenueBand: business.revenueBand,
          email: business.email,
        },
        representative: latest
          ? {
              name: stringField(latest.fields, 'representativeName'),
              relationship: stringField(latest.fields, 'representativeRelationship'),
            }
          : null,
        declaredEvidence: evidence.map((e) => e.kind),
        consent: latest
          ? {
              version: latest.consentVersion,
              at: latest.consentAt?.toISOString() ?? null,
            }
          : null,
        deletionRequestedAt:
          business.profileEvents?.[0]?.createdAt.toISOString() ??
          business.verificationAuditEvents[0]?.createdAt.toISOString() ??
          null,
      };
    });
  } catch (err) {
    console.error('[my-data] getMyData failed:', describeError(err));
    return null;
  }
}

/**
 * The email the owner signs in with. It lives in Privy, not in our database,
 * so it is fetched on demand; `null` when Privy is unconfigured or unreachable.
 */
export async function getLoginEmail(privyUserId: string): Promise<string | null> {
  const client = privyClient();
  if (!client) return null;
  try {
    const user = await client.getUserById(privyUserId);
    return user.email?.address ?? null;
  } catch (err) {
    console.error('[my-data] getLoginEmail failed:', describeError(err));
    return null;
  }
}
