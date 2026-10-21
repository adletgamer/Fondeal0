'use server';

import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@fondealo/database';
import { describeError } from '@/lib/auth/session';
import {
  WAITLIST_CONSENT_VERSION,
  WAITLIST_COUNTRIES,
  WAITLIST_HONEYPOT_FIELD,
  WAITLIST_PROFILES,
  type WaitlistField,
} from '@/lib/waitlist';

export type WaitlistResult =
  | { ok: true; email: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<WaitlistField, string>> };

/** At most this many new entries per hashed IP inside the window. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Escribe tu correo.')
    .max(254, 'Revisa tu correo. Parece demasiado largo.')
    .email('Revisa tu correo. Parece que le falta algo, por ejemplo la @.'),
  profile: z.enum(WAITLIST_PROFILES, { message: 'Elige la opción que mejor te describe.' }),
  country: z.enum(WAITLIST_COUNTRIES, {
    message: 'Elige dónde está constituida tu empresa.',
  }),
  companyName: z
    .string()
    .trim()
    .max(120, 'Usa como máximo 120 caracteres.')
    .optional()
    .transform((v) => (v ? v : undefined)),
  interviewOptIn: z.literal('on').optional(),
  consent: z.literal('on', { message: 'Para unirte, marca la casilla de consentimiento.' }),
});

/**
 * HMAC of the caller's IP with a server secret. A plain hash of an IPv4
 * address is reversible by brute force, so without a secret no IP-derived
 * value is stored at all (and rate limiting is skipped).
 */
async function clientIpHash(): Promise<string | null> {
  const secret = process.env.WAITLIST_IP_SECRET;
  if (!secret) return null;
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim();
  if (!ip) return null;
  return createHmac('sha256', secret).update(ip).digest('hex');
}

/**
 * Public action behind the landing's early-access form. Creates a
 * WaitlistEntry and nothing else — no account, wallet or KYB record.
 *
 * Privacy: an address that is already on the list gets the same success
 * answer and its row is left untouched, so the form can't be used to learn
 * who signed up or to change someone else's entry. A filled honeypot also
 * gets a success answer, without writing.
 */
export async function joinWaitlist(
  _prev: WaitlistResult | null,
  formData: FormData,
): Promise<WaitlistResult> {
  if (String(formData.get(WAITLIST_HONEYPOT_FIELD) ?? '').trim() !== '') {
    return {
      ok: true,
      email: String(formData.get('email') ?? '')
        .trim()
        .toLowerCase(),
    };
  }

  const parsed = waitlistSchema.safeParse({
    email: formData.get('email') ?? '',
    profile: formData.get('profile') ?? undefined,
    country: formData.get('country') ?? undefined,
    companyName: formData.get('companyName') ?? undefined,
    interviewOptIn: formData.get('interviewOptIn') ?? undefined,
    consent: formData.get('consent') ?? undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Partial<Record<WaitlistField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as WaitlistField;
      fieldErrors[field] ??= issue.message;
    }
    return { ok: false, error: 'Revisa los campos marcados.', fieldErrors };
  }
  const d = parsed.data;

  try {
    const ipHash = await clientIpHash();
    if (ipHash) {
      const recent = await prisma.waitlistEntry.count({
        where: { ipHash, createdAt: { gte: new Date(Date.now() - RATE_WINDOW_MS) } },
      });
      if (recent >= RATE_LIMIT) {
        return {
          ok: false,
          error: 'Recibimos varios intentos seguidos. Espera unos minutos e inténtalo otra vez.',
        };
      }
    }

    const existing = await prisma.waitlistEntry.findUnique({
      where: { email: d.email },
      select: { id: true },
    });
    if (!existing) {
      await prisma.waitlistEntry.create({
        data: {
          email: d.email,
          profile: d.profile,
          country: d.country,
          companyName: d.companyName ?? null,
          interviewOptIn: d.interviewOptIn === 'on',
          consentVersion: WAITLIST_CONSENT_VERSION,
          consentAt: new Date(),
          ipHash,
        },
      });
    }
    return { ok: true, email: d.email };
  } catch (err) {
    // Two identical submissions racing on the unique email: the address is on the list.
    if ((err as { code?: string }).code === 'P2002') return { ok: true, email: d.email };
    // Never log the address itself.
    console.error('[joinWaitlist] failed:', describeError(err));
    return {
      ok: false,
      error: 'No pudimos guardar tus datos. Revisa tu conexión e inténtalo de nuevo.',
    };
  }
}
