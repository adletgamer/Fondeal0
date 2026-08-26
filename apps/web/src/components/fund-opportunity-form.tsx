'use client';

import { useActionState } from 'react';
import { Button } from '@fondealo/ui';
import { fundOpportunity, type ActionResult } from '@/lib/actions/opportunities';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

const initialState: ActionResult | null = null;

/** Funds a real (Prisma-backed) opportunity via the Phase 6 Server Action. */
export function FundOpportunityForm({ opportunityId }: { opportunityId: string }) {
  const [state, formAction, pending] = useActionState(fundOpportunity, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-2">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <input
        name="investorAddress"
        placeholder="Your Stellar address (G…)"
        className={`${inputClass} font-mono`}
        required
      />
      <input
        name="amount"
        type="number"
        min="1"
        step="1"
        placeholder="Amount (USDC)"
        className={inputClass}
        required
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Funding…' : 'Fund in USDC'}
      </Button>
      {state && !state.ok ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state && state.ok ? <p className="text-xs text-brand-600">{state.message}</p> : null}
    </form>
  );
}
