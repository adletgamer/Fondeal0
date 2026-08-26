'use client';

import { useActionState } from 'react';
import { Button, Field } from '@fondealo/ui';
import { fundOpportunity, type ActionResult } from '@/lib/actions/opportunities';

const initialState: ActionResult | null = null;

/** Funds a real (Prisma-backed) opportunity via the Phase 6 Server Action. */
export function FundOpportunityForm({ opportunityId }: { opportunityId: string }) {
  const [state, formAction, pending] = useActionState(fundOpportunity, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-2.5">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <Field
        label="Your Stellar address"
        name="investorAddress"
        placeholder="G…"
        inputClassName="font-mono"
        required
      />
      <Field
        label="Amount"
        name="amount"
        type="number"
        min="1"
        step="1"
        placeholder="500"
        hint="USDC"
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
