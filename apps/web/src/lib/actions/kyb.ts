'use server';

import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@fondealo/database';
import { getSession } from '@/lib/auth/session';
import {
  REVENUE_BANDS,
  SECTORS,
  findCountry,
  normalizeTaxId,
  sandboxDecision,
} from '@/lib/providers/kyb';
import { runProviderCheck, SandboxVerifier } from '@/lib/providers/kyb-server';

const CONSENT_VERSION = 'kyb-intake-v1';

export type KybResult =
  | { ok: true; status: 'Processing'; reasons: string[]; providerRef: string }
  | { ok: false; error: string };

const kybSchema = z.object({
  legalName: z.string().trim().min(2, 'Legal name is required').max(120),
  country: z.string().refine((c) => Boolean(findCountry(c)), 'Select a country'),
  taxId: z.string().transform(normalizeTaxId),
  sector: z.enum(SECTORS, { message: 'Select a sector' }),
  foundedYear: z.coerce
    .number()
    .int()
    .min(1900, 'Enter a valid year')
    .max(new Date().getFullYear(), 'Founding year cannot be in the future'),
  revenueBand: z.enum(REVENUE_BANDS, { message: 'Select a revenue range' }),
  email: z.string().trim().email('Enter a valid contact email'),
  representativeName: z.string().trim().min(2, 'Enter the representative name').max(120),
  representativeRelationship: z.enum(['Owner', 'Director', 'Authorized agent']),
  idempotencyKey: z.string().uuid(),
  verifierId: z.literal('sandbox', { message: 'That verifier is not available yet' }),
  docs: z.array(z.enum(['registration', 'tax-id', 'ownership', 'address'])).max(4),
  accept: z.literal('on', { message: 'Accept the declaration to continue' }),
  evidenceConsent: z.literal('on', { message: 'Consent to evidence processing is required' }),
});

/**
 * Records a business application. The sandbox checks input format only; it
 * cannot approve KYB, underwriting or Passport issuance. Identity comes from
 * the verified session, never from the form.
 */
export async function submitKyb(_prev: KybResult | null, formData: FormData): Promise<KybResult> {
  const session = await getSession();
  if (!session?.stellarAddress) {
    return { ok: false, error: 'Your session expired. Refresh the page and log in again.' };
  }
  if (session.role !== 'Business') {
    return { ok: false, error: 'Only business accounts can register a business.' };
  }

  // The intake accepts declarations, never document bytes. Bound the payload
  // before normalizing it so accidental PII uploads cannot be persisted.
  const entries = [...formData.entries()];
  if (
    entries.length > 30 ||
    entries.some(([, value]) => typeof value !== 'string' || value.length > 5000)
  ) {
    return { ok: false, error: 'Documents cannot be uploaded in this application.' };
  }

  const parsed = kybSchema.safeParse({
    ...Object.fromEntries(formData),
    docs: formData.getAll('docs').map(String),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' };
  const d = parsed.data;

  const country = findCountry(d.country)!;
  if (!country.pattern.test(d.taxId)) {
    return {
      ok: false,
      error: `Enter a valid ${country.taxIdLabel} for ${country.name} (${country.taxIdHint}).`,
    };
  }
  if (!d.docs.includes('registration') || !d.docs.includes('tax-id')) {
    return { ok: false, error: 'Confirm business and tax registration evidence.' };
  }

  const address = session.stellarAddress;

  const decision = sandboxDecision(d.taxId);
  const check = await runProviderCheck(SandboxVerifier, { country: d.country, taxId: d.taxId });
  const reasons = check.result.startsWith('Synthetic')
    ? decision.reasons
    : ['The sandbox check was unavailable. Your application remains pending review.'];
  const providerRef = `sbx_${randomBytes(6).toString('hex')}`;
  // A random salt prevents offline guessing of predictable tax IDs if this
  // commitment is eventually published on-chain. The salt stays off-chain.
  const commitmentSalt = randomBytes(32).toString('hex');
  const dataHash =
    '0x' +
    createHash('sha256')
      .update(
        JSON.stringify({
          domain: 'fondealo:kyb:v2',
          commitmentSalt,
          address,
          legalName: d.legalName,
          country: d.country,
          taxId: d.taxId,
        }),
      )
      .digest('hex');

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const retry = await tx.kybSubmission.findUnique({
        where: { idempotencyKey: d.idempotencyKey },
        select: { business: { select: { stellarAddress: true } }, providerRef: true, status: true },
      });
      if (retry) {
        if (retry.business.stellarAddress !== address) throw new Error('IDEMPOTENCY_CONFLICT');
        if (retry.status !== 'Processing') throw new Error('STALE_APPLICATION');
        return { providerRef: retry.providerRef ?? '' };
      }
      const active = await tx.kybSubmission.findFirst({
        where: {
          business: { stellarAddress: address },
          OR: [{ status: 'Processing' }, { status: 'Accepted', provider: { not: 'sandbox' } }],
        },
        select: { id: true },
      });
      if (active) throw new Error('ACTIVE_APPLICATION');
      const business = await tx.business.upsert({
        where: { stellarAddress: address },
        update: {
          legalName: d.legalName,
          country: d.country,
          taxId: d.taxId,
          email: d.email,
          sector: d.sector,
          foundedYear: d.foundedYear,
          revenueBand: d.revenueBand,
        },
        create: {
          stellarAddress: address,
          legalName: d.legalName,
          country: d.country,
          taxId: d.taxId,
          email: d.email,
          sector: d.sector,
          foundedYear: d.foundedYear,
          revenueBand: d.revenueBand,
        },
      });

      const submission = await tx.kybSubmission.create({
        data: {
          businessId: business.id,
          status: 'Processing',
          provider: d.verifierId,
          providerRef,
          idempotencyKey: d.idempotencyKey,
          consentAt: new Date(),
          consentVersion: CONSENT_VERSION,
          fields: {
            documentsDeclared: [...new Set(d.docs)],
            representativeName: d.representativeName,
            representativeRelationship: d.representativeRelationship,
            sandboxSignals: check.reasonCodes,
            sandboxFormatPass: check.result === 'SyntheticPass',
            commitmentSalt,
            commitmentVersion: 2,
          },
          dataHash,
          reviewedAt: null,
        },
      });
      const evidence = await Promise.all(
        [...new Set(d.docs)].map((kind) =>
          tx.evidenceReference.create({
            data: {
              businessId: business.id,
              kybSubmissionId: submission.id,
              kind,
              sourceType: 'self-declared',
              status: 'Declared',
            },
          }),
        ),
      );
      await tx.providerCheck.create({
        data: {
          businessId: business.id,
          kybSubmissionId: submission.id,
          idempotencyKey: `${submission.id}:sandbox:tax-id-format`,
          providerId: check.providerId,
          sourceType: check.sourceType,
          checkType: check.checkType,
          result: check.result,
          evidenceReferenceId: evidence.find((e) => e.kind === 'tax-id')?.id ?? null,
          checkedAt: check.checkedAt,
          expiresAt: check.expiresAt,
          reasonCodes: check.reasonCodes,
          failureCode: check.failureCode,
          retryable: check.retryable,
        },
      });
      await tx.verificationAuditEvent.createMany({
        data: [
          {
            businessId: business.id,
            kybSubmissionId: submission.id,
            actorPrivyUserId: session.privyUserId,
            action: 'ConsentRecorded',
            metadata: { version: CONSENT_VERSION },
          },
          {
            businessId: business.id,
            kybSubmissionId: submission.id,
            actorPrivyUserId: session.privyUserId,
            action: 'ApplicationSubmitted',
            metadata: { provider: 'sandbox', evidenceCount: evidence.length },
          },
        ],
      });
      return { providerRef };
    });
    revalidatePath('/business', 'layout');
    return {
      ok: true,
      status: 'Processing',
      reasons,
      providerRef: saved.providerRef,
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'ACTIVE_APPLICATION') {
      return { ok: false, error: 'Your business already has a verification in progress.' };
    }
    if (err instanceof Error && err.message === 'IDEMPOTENCY_CONFLICT') {
      return { ok: false, error: 'This submission reference belongs to another application.' };
    }
    if (err instanceof Error && err.message === 'STALE_APPLICATION') {
      return { ok: false, error: 'This application has changed. Refresh its status.' };
    }
    if ((err as { code?: string }).code === 'P2002') {
      // Two identical requests may race across the unique index. Return the
      // committed result only when the token is owned by this session.
      try {
        const retry = await prisma.kybSubmission.findUnique({
          where: { idempotencyKey: d.idempotencyKey },
          select: {
            business: { select: { stellarAddress: true } },
            providerRef: true,
            status: true,
          },
        });
        if (retry?.business.stellarAddress === address && retry.status === 'Processing') {
          return {
            ok: true,
            status: 'Processing',
            reasons,
            providerRef: retry.providerRef ?? '',
          };
        }
      } catch {
        // A failed retry lookup must not turn a conflict into success.
      }
      return {
        ok: false,
        error: `An application is already in progress, or that ${country.taxIdLabel} is registered to another account.`,
      };
    }
    const code = (err as { code?: unknown }).code;
    console.error('[submitKyb] persistence unavailable', {
      code: typeof code === 'string' && /^P\d{4}$/.test(code) ? code : 'UNKNOWN',
    });
    return { ok: false, error: 'We could not save your verification. Try again in a moment.' };
  }
}
