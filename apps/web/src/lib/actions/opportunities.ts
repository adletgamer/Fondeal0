'use server';

import { prisma } from '@fondealo/database';
import { RiskBand, type Opportunity } from '@fondealo/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Phase 6 (Funding Flow) backend. Real Prisma-backed reads/writes for the
 * off-chain projection — see docs/architecture.md for why Postgres is a
 * projection and Soroban stays authoritative for trust-bearing state.
 *
 * There's no SEP-10 session yet (Phase 6/7), so forms collect the Stellar
 * address directly instead of reading it from an authenticated session.
 */

const stellarAddress = z
  .string()
  .trim()
  .regex(/^G[A-Z2-7]{55}$/, 'Enter a valid Stellar public address (starts with G, 56 characters)');

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const DB_UNREACHABLE =
  'No pudimos conectar con la base de datos. Configura DATABASE_URL para probar el flujo completo — el resto del sitio sigue funcionando con datos de demo.';

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input';
}

const createOpportunitySchema = z.object({
  businessAddress: stellarAddress,
  legalName: z.string().trim().min(2, 'Legal name is required').max(120),
  country: z.string().trim().min(2, 'Country is required').max(60),
  title: z.string().trim().min(3, 'Give the opportunity a short title').max(120),
  description: z.string().trim().max(500).default(''),
  amount: z.coerce.number().positive('Amount must be greater than 0').max(1_000_000),
  termDays: z.coerce.number().int().positive().max(720),
  aprBps: z.coerce.number().int().min(0).max(6000),
  riskBand: z.nativeEnum(RiskBand),
});

/** Create (or reuse) a Business by Stellar address, then open a funding opportunity. */
export async function createOpportunity(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createOpportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data;

  try {
    const business = await prisma.business.upsert({
      where: { stellarAddress: data.businessAddress },
      update: { legalName: data.legalName, country: data.country },
      create: {
        stellarAddress: data.businessAddress,
        legalName: data.legalName,
        country: data.country,
      },
    });

    await prisma.opportunity.create({
      data: {
        businessId: business.id,
        title: data.title,
        description: data.description,
        amount: String(data.amount),
        termDays: data.termDays,
        aprBps: data.aprBps,
        riskBand: data.riskBand,
        status: 'Open',
      },
    });

    revalidatePath('/dashboard/investor');
    revalidatePath('/dashboard/business');
    return { ok: true, message: 'Opportunity created — it is now open for funding.' };
  } catch {
    return { ok: false, error: DB_UNREACHABLE };
  }
}

const fundOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  investorAddress: stellarAddress,
  amount: z.coerce.number().positive('Amount must be greater than 0'),
});

/** Record a funding contribution; flips the opportunity to Funded once fully covered. */
export async function fundOpportunity(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = fundOpportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { opportunityId, investorAddress, amount } = parsed.data;

  try {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) return { ok: false, error: 'Opportunity not found.' };
    if (opportunity.status !== 'Open') {
      return { ok: false, error: 'This opportunity is no longer open for funding.' };
    }

    const target = Number(opportunity.amount);
    const newFunded = Math.min(Number(opportunity.funded) + amount, target);
    const isFull = newFunded >= target;

    await prisma.$transaction([
      prisma.funding.create({
        data: { opportunityId, investor: investorAddress, amount: String(amount) },
      }),
      prisma.opportunity.update({
        where: { id: opportunityId },
        data: { funded: String(newFunded), status: isFull ? 'Funded' : 'Open' },
      }),
    ]);

    revalidatePath('/dashboard/investor');
    return { ok: true, message: isFull ? 'Fully funded! 🎉' : 'Funding recorded — thank you.' };
  } catch {
    return { ok: false, error: DB_UNREACHABLE };
  }
}

/**
 * Live, open/funded opportunities for the investor dashboard.
 * Returns `null` (not `[]`) on any DB error so callers can fall back to demo
 * data instead of rendering an empty state when Postgres isn't reachable yet.
 */
export async function listOpenOpportunities(): Promise<Opportunity[] | null> {
  try {
    const rows = await prisma.opportunity.findMany({
      where: { status: { in: ['Open', 'Funded'] } },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { business: true },
    });
    return rows.map((row) => ({
      id: row.id,
      business: row.business.stellarAddress,
      title: row.title,
      description: row.description,
      amount: row.amount,
      funded: row.funded,
      termDays: row.termDays,
      aprBps: row.aprBps,
      riskBand: row.riskBand,
      status: row.status,
      createdAt: Math.floor(row.createdAt.getTime() / 1000),
    }));
  } catch {
    return null;
  }
}
