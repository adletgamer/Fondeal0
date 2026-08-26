'use client';

import { useActionState, useMemo, useState } from 'react';
import { Button, Card, Field } from '@fondealo/ui';
import { fundOpportunityOnChainAware, type ActionResult } from '@/lib/actions/opportunities';

const initialState: ActionResult | null = null;

export function FundPanel({
  opportunityId,
  remaining,
  aprBps,
  termDays,
  isOpen,
}: {
  opportunityId: string;
  remaining: number;
  aprBps: number;
  termDays: number;
  isOpen: boolean;
}) {
  const [state, formAction, pending] = useActionState(fundOpportunityOnChainAware, initialState);
  const [amount, setAmount] = useState(remaining > 0 ? Math.min(remaining, 500) : 0);

  const projectedReturn = useMemo(() => {
    const interest = (amount * aprBps * termDays) / (10_000 * 365);
    return amount + interest;
  }, [amount, aprBps, termDays]);

  if (!isOpen) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Funding closed</h2>
        <p className="mt-2 text-sm text-slate-500">
          This opportunity is no longer open for new funding.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Fund in USDC</h2>
      <p className="mt-1 text-sm text-slate-500">{remaining.toLocaleString()} USDC remaining.</p>

      <form action={formAction} className="mt-4 space-y-3">
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
          max={remaining || undefined}
          step="1"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          hint="USDC"
          required
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAmount(Math.round(remaining * 0.25))}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => setAmount(Math.round(remaining * 0.5))}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => setAmount(remaining)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
          >
            Fund it all
          </button>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Projected return over {termDays} days</span>
            <span className="font-semibold text-slate-800">
              {projectedReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
            </span>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={pending || amount <= 0}>
          {pending ? 'Funding…' : `Fund ${amount.toLocaleString()} USDC`}
        </Button>

        {state && !state.ok ? <p className="text-xs text-red-600">{state.error}</p> : null}
        {state && state.ok ? <p className="text-xs text-brand-600">{state.message}</p> : null}
      </form>
    </Card>
  );
}
