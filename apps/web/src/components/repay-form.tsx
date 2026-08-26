'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Field } from '@fondealo/ui';
import { repayOpportunity, type ActionResult } from '@/lib/actions/opportunities';

const initialState: ActionResult | null = null;

export function RepayForm({ opportunityId, remaining }: { opportunityId: string; remaining: number }) {
  const [state, formAction, pending] = useActionState(repayOpportunity, initialState);
  const [amount, setAmount] = useState(remaining);

  if (remaining <= 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Loan settled</h2>
        <p className="mt-2 text-sm text-slate-500">Nothing left to repay on this loan.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Make a payment</h2>
      <p className="mt-1 text-sm text-slate-500">{remaining.toLocaleString()} USDC left to repay.</p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="opportunityId" value={opportunityId} />
        <Field
          label="Amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          max={remaining}
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          hint="USDC"
          required
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAmount(remaining)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
          >
            Pay it off ({remaining.toLocaleString()})
          </button>
        </div>
        <Button type="submit" className="w-full" disabled={pending || amount <= 0}>
          {pending ? 'Paying…' : `Pay ${amount.toLocaleString()} USDC`}
        </Button>
        {state && !state.ok ? <p className="text-xs text-red-600">{state.error}</p> : null}
        {state && state.ok ? <p className="text-xs text-brand-600">{state.message}</p> : null}
      </form>
    </Card>
  );
}
