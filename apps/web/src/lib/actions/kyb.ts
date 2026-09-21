'use server';

import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@fondealo/database';
import { bandForScore } from '@fondealo/types';
import { describeError, getSession } from '@/lib/auth/session';
import {
  INITIAL_SCORE_AFTER_KYB,
  KYB_DOCUMENTS,
  REVENUE_BANDS,
  SECTORS,
  findCountry,
  normalizeTaxId,
  sandboxDecision,
} from '@/lib/providers/kyb';

export type KybResult =
  | { ok: true; accepted: boolean; reasons: string[]; providerRef: string }
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
  verifierId: z.literal('sandbox', { message: 'That verifier is not available yet' }),
  docs: z.array(z.string()),
  accept: z.literal('on', { message: 'Accept the declaration to continue' }),
});

/**
 * Registers a business and runs it through the (sandbox) verifier. Identity
 * comes from the verified session, never from the form. An accepted business
 * gets a Passport projection at the starting score; a rejected one can
 * resubmit with corrected data.
 */
export async function submitKyb(_prev: KybResult | null, formData: FormData): Promise<KybResult> {
  const session = await getSession();
  if (!session?.stellarAddress) {
    return { ok: false, error: 'Your session expired. Refresh the page and log in again.' };
  }
  if (session.role !== 'Business') {
    return { ok: false, error: 'Only business accounts can register a business.' };
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
  const missingDoc = KYB_DOCUMENTS.find((doc) => !d.docs.includes(doc.id));
  if (missingDoc) return { ok: false, error: `Confirm you can provide: ${missingDoc.label}.` };

  const address = session.stellarAddress;

  try {
    const alreadyVerified = await prisma.kybSubmission.findFirst({
      where: { status: 'Accepted', business: { stellarAddress: address } },
      select: { id: true },
    });
    if (alreadyVerified) return { ok: false, error: 'Your business is already verified.' };
  } catch (err) {
    console.error('[submitKyb] lookup failed:', describeError(err));
    return { ok: false, error: 'We could not reach the database. Try again in a moment.' };
  }

  const decision = sandboxDecision(d.taxId);
  const status = decision.accepted ? 'Accepted' : 'Rejected';
  const providerRef = `sbx_${randomBytes(6).toString('hex')}`;
  const now = new Date();
  // Commitment to the off-chain KYB bundle (mirrored on-chain as `data_hash`); PII itself stays off-chain.
  const dataHash =
    '0x' +
    createHash('sha256')
      .update(
        JSON.stringify({ address, legalName: d.legalName, country: d.country, taxId: d.taxId }),
      )
      .digest('hex');

  try {
    await prisma.$transaction(async (tx) => {
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

      await tx.kybSubmission.create({
        data: {
          businessId: business.id,
          status,
          provider: d.verifierId,
          providerRef,
          fields: { documents: d.docs, reasons: decision.reasons, verifier: d.verifierId },
          dataHash,
          reviewedAt: now,
        },
      });

      if (decision.accepted) {
        await tx.passportProjection.upsert({
          where: { businessId: business.id },
          create: {
            businessId: business.id,
            kybStatus: 'Accepted',
            score: INITIAL_SCORE_AFTER_KYB,
            riskBand: bandForScore(INITIAL_SCORE_AFTER_KYB),
            issuedAt: now,
            updatedAt: now,
            dataHash,
          },
          update: { kybStatus: 'Accepted', updatedAt: now, dataHash },
        });
      }
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return {
        ok: false,
        error: `That ${country.taxIdLabel} is already registered to another account.`,
      };
    }
    console.error('[submitKyb] persist failed:', describeError(err));
    return { ok: false, error: 'We could not save your verification. Try again in a moment.' };
  }

  revalidatePath('/business', 'layout');
  return { ok: true, accepted: decision.accepted, reasons: decision.reasons, providerRef };
}
