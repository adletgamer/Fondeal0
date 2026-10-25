'use server';

import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@fondealo/database';
import { getSession } from '@/lib/auth/session';
import {
  REPRESENTATIVE_RELATIONSHIPS,
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
  locale: z.enum(['es', 'en']).default('es'),
  legalName: z.string().trim().min(2, 'Ingresa la razón social').max(120),
  country: z.string().refine((c) => Boolean(findCountry(c)), 'Selecciona un país'),
  taxId: z.string().transform(normalizeTaxId),
  sector: z.enum(SECTORS, { message: 'Selecciona un sector' }),
  foundedYear: z.coerce
    .number()
    .int()
    .min(1900, 'Ingresa un año válido')
    .max(new Date().getFullYear(), 'El año de fundación no puede ser futuro'),
  revenueBand: z.enum(REVENUE_BANDS, { message: 'Selecciona un rango de ingresos' }),
  email: z.string().trim().email('Ingresa un correo de contacto válido'),
  representativeName: z.string().trim().min(2, 'Ingresa el nombre del representante').max(120),
  representativeRelationship: z.enum(REPRESENTATIVE_RELATIONSHIPS, {
    message: 'Selecciona tu relación con la empresa',
  }),
  idempotencyKey: z.string().uuid(),
  verifierId: z.literal('sandbox', { message: 'Ese verificador aún no está disponible' }),
  docs: z.array(z.enum(['registration', 'tax-id', 'ownership', 'address'])).max(4),
  accept: z.literal('on', { message: 'Acepta la declaración para continuar' }),
  evidenceConsent: z.literal('on', {
    message: 'Necesitamos tu consentimiento para tratar estos datos',
  }),
});

/**
 * Records a business application. The sandbox checks input format only; it
 * cannot approve KYB, underwriting or Passport issuance. Identity comes from
 * the verified session, never from the form.
 */
export async function submitKyb(_prev: KybResult | null, formData: FormData): Promise<KybResult> {
  const session = await getSession();
  if (!session?.stellarAddress) {
    return { ok: false, error: 'Tu sesión expiró. Recarga la página e inicia sesión de nuevo.' };
  }
  if (session.role !== 'Business') {
    return { ok: false, error: 'Solo las cuentas de empresa pueden registrar una empresa.' };
  }

  // The intake accepts declarations, never document bytes. Bound the payload
  // before normalizing it so accidental PII uploads cannot be persisted.
  const entries = [...formData.entries()];
  if (
    entries.length > 30 ||
    entries.some(([, value]) => typeof value !== 'string' || value.length > 5000)
  ) {
    return { ok: false, error: 'En esta solicitud no se pueden subir documentos.' };
  }

  const parsed = kybSchema.safeParse({
    ...Object.fromEntries(formData),
    docs: formData.getAll('docs').map(String),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos no válidos' };
  const d = parsed.data;
  const consentVersion = d.locale === 'en' ? `${CONSENT_VERSION}-en` : CONSENT_VERSION;

  const country = findCountry(d.country)!;
  if (!country.pattern.test(d.taxId)) {
    return {
      ok: false,
      error: `Ingresa un ${country.taxIdLabel} válido para ${country.label} (${country.taxIdHint}).`,
    };
  }
  if (!d.docs.includes('registration') || !d.docs.includes('tax-id')) {
    return {
      ok: false,
      error: 'Confirma que cuentas con la constancia de inscripción y el documento tributario.',
    };
  }

  const address = session.stellarAddress;

  const decision = sandboxDecision(d.taxId);
  const check = await runProviderCheck(SandboxVerifier, { country: d.country, taxId: d.taxId });
  const reasons = check.result.startsWith('Synthetic')
    ? decision.reasons
    : ['La revisión de prueba no estuvo disponible. Tu solicitud sigue pendiente de revisión.'];
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
          consentVersion,
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
            metadata: { version: consentVersion, locale: d.locale },
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
      return { ok: false, error: 'Tu empresa ya tiene una verificación en curso.' };
    }
    if (err instanceof Error && err.message === 'IDEMPOTENCY_CONFLICT') {
      return { ok: false, error: 'Esta referencia pertenece a otra solicitud.' };
    }
    if (err instanceof Error && err.message === 'STALE_APPLICATION') {
      return { ok: false, error: 'Esta solicitud cambió. Actualiza su estado.' };
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
        error: `Ya hay una solicitud en curso, o ese ${country.taxIdLabel} está registrado en otra cuenta.`,
      };
    }
    const code = (err as { code?: unknown }).code;
    console.error('[submitKyb] persistence unavailable', {
      code: typeof code === 'string' && /^P\d{4}$/.test(code) ? code : 'UNKNOWN',
    });
    return {
      ok: false,
      error: 'No pudimos guardar tu solicitud. Inténtalo de nuevo en un momento.',
    };
  }
}
