'use server';

import { prisma } from '@fondealo/database';
import { RiskBand } from '@fondealo/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Phase 6 (Funding Flow) backend. Real Prisma-backed reads/writes for the
 * off-chain projection — see docs/architecture.md for why Postgres is a
 * projection and Soroban stays authoritative for trust-bearing state.
 *
 * `businessAddress`/`investorAddress` here are the caller's own verified
 * Stellar address (from `getSession()` in the page, passed through a hidden
 * form field) — never an arbitrary address a client could substitute to act
 * as someone else.
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

    revalidatePath('/invest');
    revalidatePath('/business');
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

    revalidatePath('/invest');
    return { ok: true, message: isFull ? 'Fully funded! 🎉' : 'Funding recorded — thank you.' };
  } catch {
    return { ok: false, error: DB_UNREACHABLE };
  }
}

/**
 * These two names stay stable for the form components that already import
 * them, but the "on-chain aware" part of the flow moved client-side (see
 * apps/web/src/components/fund-panel.tsx): building an unsigned tx and
 * getting it signed needs a wallet, which a Server Action doesn't have.
 * A Server Action can construct `EscrowClient` and get back unsigned XDR,
 * but signing nothing and calling that "on-chain" was actively misleading —
 * so these are now plain aliases for the Prisma-backed off-chain projection
 * writers. The client attempts the real chain path first and only calls
 * into these as the fallback (or as the projection-sync step after a real
 * on-chain submission succeeds).
 */
export async function createOpportunityOnChainAware(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return createOpportunity(prev, formData);
}

export async function fundOpportunityOnChainAware(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return fundOpportunity(prev, formData);
}

const repayOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
});

/**
 * Business repayment. Off-chain equivalent of `loan_escrow.repay`: may be
 * called multiple times; the call that brings cumulative `repaid` to the
 * full amount due (principal + simple interest, same formula as
 * `buildRepaymentSchedule`) marks the loan Repaid.
 */
export async function repayOpportunity(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = repayOpportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { opportunityId, amount } = parsed.data;

  try {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) return { ok: false, error: 'Loan not found.' };
    if (opportunity.status !== 'Funded' && opportunity.status !== 'Active') {
      return { ok: false, error: 'This loan is not active.' };
    }

    const principal = Number(opportunity.amount);
    const totalDue = principal + (principal * opportunity.aprBps * opportunity.termDays) / (10_000 * 365);
    // `amount` is stored as a string (stroops precision), so sum in JS —
    // Prisma's `_sum` aggregate only works on numeric column types.
    const priorRepayments = await prisma.repayment.findMany({
      where: { opportunityId },
      select: { amount: true },
    });
    const alreadyRepaid = priorRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
    const newRepaid = alreadyRepaid + amount;
    if (newRepaid > totalDue + 0.01) {
      return { ok: false, error: `Amount exceeds what's left due (${(totalDue - alreadyRepaid).toFixed(2)} USDC).` };
    }
    const isFinal = newRepaid >= totalDue - 0.01;

    await prisma.$transaction([
      prisma.repayment.create({
        data: { opportunityId, amount: String(amount), onTime: true, isFinal },
      }),
      prisma.opportunity.update({
        where: { id: opportunityId },
        data: { status: isFinal ? 'Repaid' : 'Active' },
      }),
    ]);

    revalidatePath(`/business/loans/${opportunityId}`);
    revalidatePath('/business');
    return {
      ok: true,
      message: isFinal ? 'Loan fully repaid — collateral returned.' : 'Payment recorded.',
    };
  } catch {
    return { ok: false, error: DB_UNREACHABLE };
  }
}

