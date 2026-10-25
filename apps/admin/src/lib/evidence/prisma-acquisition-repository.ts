import { prisma } from '@fondealo/database';
import { SYNTHETIC_SUBJECT } from './synthetic-peru-x402-provider';
import type {
  EvidenceAcquisitionRepository,
  EvidenceRequest,
  ExistingEvidence,
  AcquisitionRecord,
  RawEvidence,
} from './orchestrator';
import type { AuthorizationResult, EvidenceQuote } from './spending-policy';

/** Server-only persistence adapter. The database must be an isolated Development target before use. */
export class PrismaEvidenceAcquisitionRepository implements EvidenceAcquisitionRepository {
  async findByIdempotencyKey(key: string): Promise<AcquisitionRecord | null> {
    const found = await prisma.evidenceAcquisition.findUnique({
      where: { idempotencyKey: key },
      include: { providerChecks: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
    if (!found) return null;
    const check = found.providerChecks[0];
    return {
      id: found.id,
      status: found.paymentStatus,
      result: check
        ? {
            providerId: check.providerId,
            checkType: check.checkType,
            subject: SYNTHETIC_SUBJECT,
            result: check.result as RawEvidence['result'],
            sourceType: 'synthetic',
            checkedAt: check.checkedAt,
            expiresAt: check.expiresAt ?? new Date(0),
            reasonCodes: check.reasonCodes as string[],
            responseHash: found.responseHash ?? '',
            paymentTxHash: found.paymentTxHash ?? '',
            paidAmount: found.paidAmount ?? '',
          }
        : undefined,
    };
  }

  async findValidEvidence(
    submissionId: string,
    providerId: string,
    evidenceType: string,
    now: Date,
  ): Promise<ExistingEvidence> {
    const reference = await prisma.evidenceReference.findFirst({
      where: {
        kybSubmissionId: submissionId,
        kind: evidenceType,
        sourceType: 'synthetic',
        status: 'Verified',
        providerChecks: {
          some: { providerId, checkType: evidenceType, expiresAt: { gt: now } },
        },
      },
      include: {
        providerChecks: {
          where: { providerId, checkType: evidenceType },
          take: 1,
          orderBy: { checkedAt: 'desc' },
        },
      },
    });
    const check = reference?.providerChecks[0];
    return check
      ? { result: check.result, expiresAt: check.expiresAt, sourceType: check.sourceType }
      : null;
  }

  async reserve(
    input: EvidenceRequest & { providerId: string; quote: EvidenceQuote },
    authorize: (applicationSpent: bigint, dailySpent: bigint) => Promise<AuthorizationResult>,
  ): Promise<{ ok: true; record: AcquisitionRecord } | { ok: false; code: string }> {
    return prisma.$transaction(
      async (tx) => {
        // Serialize local evidence reservations so concurrent requests cannot overshoot the daily cap.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(84261135)`;
        const activeStatuses = ['Pending', 'Authorized', 'Paid', 'Fulfilled'];
        const [application, daily] = await Promise.all([
          tx.evidenceAcquisition.findMany({
            where: { kybSubmissionId: input.submissionId, paymentStatus: { in: activeStatuses } },
            select: { quotedAmount: true },
          }),
          tx.evidenceAcquisition.findMany({
            where: {
              createdAt: {
                gte: new Date(
                  Date.UTC(
                    input.now.getUTCFullYear(),
                    input.now.getUTCMonth(),
                    input.now.getUTCDate(),
                  ),
                ),
              },
              paymentStatus: { in: activeStatuses },
            },
            select: { quotedAmount: true },
          }),
        ]);
        const sum = (rows: { quotedAmount: string | null }[]) =>
          rows.reduce((total, item) => total + (toBaseUnits(item.quotedAmount ?? '0') ?? 0n), 0n);
        const decision = await authorize(sum(application), sum(daily));
        if (!decision.allowed) return { ok: false as const, code: decision.reason };
        const created = await tx.evidenceAcquisition.create({
          data: {
            businessId: input.businessId,
            kybSubmissionId: input.submissionId,
            providerId: input.providerId,
            evidenceType: input.evidenceType,
            country: input.country,
            requestHash: input.requestHash,
            idempotencyKey: input.idempotencyKey,
            network: input.quote.network,
            asset: input.quote.asset,
            quotedAmount: input.quote.amount,
          },
        });
        return { ok: true as const, record: { id: created.id, status: created.paymentStatus } };
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async markAuthorized(id: string) {
    await prisma.evidenceAcquisition.update({
      where: { id },
      data: { paymentStatus: 'Authorized' },
    });
  }

  async markPaid(id: string, evidence: RawEvidence) {
    await prisma.evidenceAcquisition.update({
      where: { id },
      data: {
        paymentStatus: 'Paid',
        paidAmount: evidence.paidAmount,
        paymentTxHash: evidence.paymentTxHash,
        paidAt: new Date(),
        responseHash: evidence.responseHash,
      },
    });
  }

  async finalize(id: string, input: { evidence: RawEvidence; idempotencyKey: string }) {
    const acquisition = await prisma.evidenceAcquisition.findUniqueOrThrow({ where: { id } });
    await prisma.$transaction(async (tx) => {
      const reference = await tx.evidenceReference.upsert({
        where: {
          kybSubmissionId_kind_sourceType: {
            kybSubmissionId: acquisition.kybSubmissionId,
            kind: acquisition.evidenceType,
            sourceType: 'synthetic',
          },
        },
        create: {
          businessId: acquisition.businessId,
          kybSubmissionId: acquisition.kybSubmissionId,
          kind: acquisition.evidenceType,
          sourceType: 'synthetic',
          status: 'Verified',
          expiresAt: input.evidence.expiresAt,
        },
        update: { status: 'Verified', expiresAt: input.evidence.expiresAt },
      });
      await tx.providerCheck.create({
        data: {
          businessId: acquisition.businessId,
          kybSubmissionId: acquisition.kybSubmissionId,
          idempotencyKey: `${input.idempotencyKey}:normalized-check`,
          evidenceAcquisitionId: id,
          providerId: input.evidence.providerId,
          sourceType: input.evidence.sourceType,
          checkType: input.evidence.checkType,
          result: input.evidence.result,
          evidenceReferenceId: reference.id,
          checkedAt: input.evidence.checkedAt,
          expiresAt: input.evidence.expiresAt,
          reasonCodes: input.evidence.reasonCodes,
          retryable: false,
        },
      });
      await tx.evidenceAcquisition.update({
        where: { id },
        data: { paymentStatus: 'Fulfilled', fulfilledAt: new Date() },
      });
      await tx.verificationAuditEvent.create({
        data: {
          businessId: acquisition.businessId,
          kybSubmissionId: acquisition.kybSubmissionId,
          actorPrivyUserId: 'service:evidence-orchestrator',
          action: 'EvidenceAcquisitionFinalized',
          metadata: {
            acquisitionId: id,
            providerId: input.evidence.providerId,
            evidenceType: input.evidence.checkType,
            responseHash: input.evidence.responseHash,
          },
        },
      });
    });
  }

  async fail(id: string, failureCode: string, retryable: boolean) {
    await prisma.evidenceAcquisition.update({
      where: { id },
      data: { paymentStatus: 'Failed', failureCode, retryable },
    });
  }

  async writeAudit(input: {
    businessId: string;
    submissionId: string;
    action: string;
    metadata: Record<string, string>;
  }) {
    await prisma.verificationAuditEvent.create({
      data: {
        businessId: input.businessId,
        kybSubmissionId: input.submissionId,
        actorPrivyUserId: 'service:evidence-orchestrator',
        action: input.action,
        metadata: input.metadata,
      },
    });
  }
}

function toBaseUnits(amount: string): bigint | null {
  if (!/^(0|[1-9]\d{0,7})(\.\d{1,7})?$/.test(amount)) return null;
  const [whole = '0', fraction = ''] = amount.split('.');
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, '0'));
}
