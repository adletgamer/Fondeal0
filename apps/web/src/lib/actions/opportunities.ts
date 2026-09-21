'use server';

import { prisma } from '@fondealo/database';
import { requiredCollateral, splitProRata, type RiskBand } from '@fondealo/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { describeError, getSession, type Session } from '@/lib/auth/session';
import {
  InsufficientFundsError,
  credit,
  debit,
  usdcToStroops,
  withSerializableRetry,
} from '@/lib/wallet/ledger';

/**
 * Phase 6 (Funding Flow) backend. Real Prisma-backed reads/writes for the
 * off-chain projection — see docs/architecture.md for why Postgres is a
 * projection and Soroban stays authoritative for trust-bearing state.
 *
 * Every action derives "who is calling" from the verified session
 * (`getSession()`), never from a form field: a client-supplied address would
 * let anyone spend another wallet's balance or act as another business. Money
 * moves through the append-only ledger (lib/wallet/ledger.ts) inside
 * serializable transactions, so a balance check and the debit are atomic.
 */

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const DB_UNREACHABLE = 'We could not reach the database. Try again in a moment.';
const SESSION_EXPIRED = 'Your session expired. Refresh the page and log in again.';

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input';
}

async function requireRole(
  role: 'Business' | 'Investor',
): Promise<{ session: Session & { stellarAddress: string } } | { error: string }> {
  const session = await getSession();
  if (!session?.stellarAddress) return { error: SESSION_EXPIRED };
  if (session.role !== role) return { error: `Only ${role.toLowerCase()} accounts can do this.` };
  return { session: session as Session & { stellarAddress: string } };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Result of a transactional step: either a user-facing error or the success payload. */
type Outcome<T> = { error: string } | ({ error?: undefined } & T);

/* ------------------------------ createOpportunity ------------------------------ */

const createOpportunitySchema = z.object({
  title: z.string().trim().min(3, 'Give the opportunity a short title').max(120),
  description: z.string().trim().max(500).default(''),
  amount: z.coerce
    .number()
    .int('Use a whole number of USDC')
    .positive('Amount must be greater than 0')
    .max(1_000_000),
  termDays: z.coerce.number().int().positive().max(720),
  aprBps: z.coerce.number().int().min(0).max(6000),
});

/**
 * Opens a funding opportunity for the caller's verified business and locks the
 * collateral its Passport band requires. The band comes from the Passport
 * projection, not the form — a tampered request can't lower its own collateral.
 */
export async function createOpportunity(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireRole('Business');
  if ('error' in auth) return { ok: false, error: auth.error };
  const address = auth.session.stellarAddress;

  const parsed = createOpportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data;

  try {
    const business = await prisma.business.findUnique({
      where: { stellarAddress: address },
      include: {
        passport: true,
        kybSubmissions: { where: { status: 'Accepted' }, take: 1, select: { id: true } },
      },
    });
    if (!business || business.kybSubmissions.length === 0 || !business.passport) {
      return { ok: false, error: 'Verify your business before requesting financing.' };
    }
    const band: RiskBand = business.passport.riskBand;
    const collateral = Number(requiredCollateral(String(data.amount), band));

    await withSerializableRetry(async (tx) => {
      if (collateral > 0) {
        await debit(tx, {
          address,
          kind: 'Collateral',
          amountStroops: usdcToStroops(collateral),
          reference: `Collateral — ${data.title}`,
        });
      }
      await tx.opportunity.create({
        data: {
          businessId: business.id,
          title: data.title,
          description: data.description,
          amount: String(data.amount),
          termDays: data.termDays,
          aprBps: data.aprBps,
          riskBand: band,
          status: 'Open',
        },
      });
    });

    revalidatePath('/invest', 'layout');
    revalidatePath('/business', 'layout');
    return {
      ok: true,
      message: `Opportunity created — ${collateral.toLocaleString()} USDC collateral locked, now open for funding.`,
    };
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      return {
        ok: false,
        error: `You need enough balance to lock the collateral. ${err.message} Add test funds and try again.`,
      };
    }
    console.error('[createOpportunity] failed:', describeError(err));
    return { ok: false, error: DB_UNREACHABLE };
  }
}

/* ------------------------------ fundOpportunity ------------------------------ */

const fundOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
});

/** Debits the investor's balance and records the funding; on full coverage the business receives the principal. */
export async function fundOpportunity(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireRole('Investor');
  if ('error' in auth) return { ok: false, error: auth.error };
  const investor = auth.session.stellarAddress;

  const parsed = fundOpportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { opportunityId } = parsed.data;
  const amount = round2(parsed.data.amount);
  if (amount <= 0) return { ok: false, error: 'Amount must be greater than 0' };

  try {
    const outcome = await withSerializableRetry<Outcome<{ isFull: boolean }>>(async (tx) => {
      const opportunity = await tx.opportunity.findUnique({
        where: { id: opportunityId },
        include: { business: { select: { stellarAddress: true } } },
      });
      if (!opportunity) return { error: 'Opportunity not found.' };
      if (opportunity.status !== 'Open') {
        return { error: 'This opportunity is no longer open for funding.' };
      }
      if (opportunity.business.stellarAddress === investor) {
        return { error: 'You cannot fund your own business.' };
      }

      const target = Number(opportunity.amount);
      const remaining = round2(target - Number(opportunity.funded));
      if (amount > remaining + 0.001) {
        return { error: `Only ${remaining.toLocaleString()} USDC is still open.` };
      }
      const newFunded = round2(Number(opportunity.funded) + amount);
      const isFull = newFunded >= target - 0.001;

      await debit(tx, {
        address: investor,
        kind: 'Fund',
        amountStroops: usdcToStroops(amount),
        reference: `Funded — ${opportunity.title}`,
      });
      await tx.funding.create({
        data: { opportunityId, investor, amount: String(amount) },
      });
      await tx.opportunity.update({
        where: { id: opportunityId },
        data: { funded: String(newFunded), status: isFull ? 'Funded' : 'Open' },
      });
      if (isFull) {
        await credit(tx, {
          address: opportunity.business.stellarAddress,
          kind: 'Payout',
          amountStroops: usdcToStroops(target),
          reference: `Loan proceeds — ${opportunity.title}`,
        });
      }
      return { isFull };
    });

    if (outcome.error !== undefined) return { ok: false, error: outcome.error };

    revalidatePath('/invest', 'layout');
    revalidatePath('/business', 'layout');
    return {
      ok: true,
      message: outcome.isFull
        ? 'Fully funded — the business received the loan.'
        : 'Funding recorded — thank you.',
    };
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      return { ok: false, error: `${err.message} Add test funds to keep going.` };
    }
    console.error('[fundOpportunity] failed:', describeError(err));
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

/* ------------------------------ repayOpportunity ------------------------------ */

const repayOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
});

/**
 * Business repayment. Off-chain equivalent of `loan_escrow.repay`: debits the
 * business, pays the funders pro rata, and the call that brings cumulative
 * `repaid` to the full amount due (principal + simple interest, same formula
 * as `buildRepaymentSchedule`) marks the loan Repaid and returns the collateral.
 */
export async function repayOpportunity(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireRole('Business');
  if ('error' in auth) return { ok: false, error: auth.error };
  const address = auth.session.stellarAddress;

  const parsed = repayOpportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { opportunityId } = parsed.data;
  const amount = round2(parsed.data.amount);
  if (amount <= 0) return { ok: false, error: 'Amount must be greater than 0' };

  try {
    const outcome = await withSerializableRetry<Outcome<{ isFinal: boolean }>>(async (tx) => {
      const opportunity = await tx.opportunity.findUnique({
        where: { id: opportunityId },
        include: { business: { select: { stellarAddress: true } } },
      });
      if (!opportunity || opportunity.business.stellarAddress !== address) {
        return { error: 'Loan not found.' };
      }
      if (opportunity.status !== 'Funded' && opportunity.status !== 'Active') {
        return { error: 'This loan is not active.' };
      }

      const principal = Number(opportunity.amount);
      const totalDue =
        principal + (principal * opportunity.aprBps * opportunity.termDays) / (10_000 * 365);
      // `amount` is stored as a string (stroops precision), so sum in JS —
      // Prisma's `_sum` aggregate only works on numeric column types.
      const priorRepayments = await tx.repayment.findMany({
        where: { opportunityId },
        select: { amount: true },
      });
      const alreadyRepaid = priorRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const newRepaid = alreadyRepaid + amount;
      if (newRepaid > totalDue + 0.01) {
        return {
          error: `Amount exceeds what's left due (${round2(totalDue - alreadyRepaid).toFixed(2)} USDC).`,
        };
      }
      const isFinal = newRepaid >= totalDue - 0.01;

      await debit(tx, {
        address,
        kind: 'Repay',
        amountStroops: usdcToStroops(amount),
        reference: `Repayment — ${opportunity.title}`,
      });
      await tx.repayment.create({
        data: { opportunityId, amount: String(amount), onTime: true, isFinal },
      });
      await tx.opportunity.update({
        where: { id: opportunityId },
        data: { status: isFinal ? 'Repaid' : 'Active' },
      });

      // Pay the funders pro rata; the shares always sum to exactly the payment.
      const fundings = await tx.funding.findMany({ where: { opportunityId } });
      const shares = splitProRata(
        usdcToStroops(amount),
        fundings.map((f) => usdcToStroops(Number(f.amount))),
      );
      for (const [i, f] of fundings.entries()) {
        const share = shares[i] ?? BigInt(0);
        if (share > BigInt(0)) {
          await credit(tx, {
            address: f.investor,
            kind: 'Payout',
            amountStroops: share,
            reference: `Repayment received — ${opportunity.title}`,
          });
        }
      }

      if (isFinal) {
        const collateral = Number(
          requiredCollateral(String(Math.round(principal)), opportunity.riskBand),
        );
        if (collateral > 0) {
          await credit(tx, {
            address,
            kind: 'CollateralReturn',
            amountStroops: usdcToStroops(collateral),
            reference: `Collateral returned — ${opportunity.title}`,
          });
        }
      }
      return { isFinal };
    });

    if (outcome.error !== undefined) return { ok: false, error: outcome.error };

    revalidatePath(`/business/loans/${opportunityId}`);
    revalidatePath('/business', 'layout');
    revalidatePath('/invest', 'layout');
    return {
      ok: true,
      message: outcome.isFinal ? 'Loan fully repaid — collateral returned.' : 'Payment recorded.',
    };
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      return { ok: false, error: `${err.message} Add test funds to make this payment.` };
    }
    console.error('[repayOpportunity] failed:', describeError(err));
    return { ok: false, error: DB_UNREACHABLE };
  }
}
