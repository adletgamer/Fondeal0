'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Field } from '@fondealo/ui';
import { repayOpportunity, type ActionResult } from '@/lib/actions/opportunities';

const initialState: ActionResult | null = null;

export function RepayForm({
  opportunityId,
  remaining,
  balanceUsdc,
}: {
  opportunityId: string;
  remaining: number;
  balanceUsdc: number | null;
}) {
  const [state, formAction, pending] = useActionState(repayOpportunity, initialState);
  const [amount, setAmount] = useState(remaining);
  const insufficient = balanceUsdc !== null && amount > balanceUsdc;

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
      <p className="mt-1 text-sm text-slate-500">
        {remaining.toLocaleString('en-US')} USDC left to repay.
        {balanceUsdc !== null ? (
          <>
            {' '}
            Your balance:{' '}
            <strong className="text-slate-700">
              {balanceUsdc.toLocaleString('en-US')} USDC
            </strong>{' '}
            <span className="text-slate-400">(test funds)</span>
          </>
        ) : null}
      </p>

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
            Pay it off ({remaining.toLocaleString('en-US')})
          </button>
        </div>
        {insufficient ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Not enough balance for this payment.{' '}
            <a href="/business#balance" className="font-medium underline">
              Add test funds
            </a>
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending || amount <= 0 || insufficient}>
          {pending ? 'Paying…' : `Pay ${amount.toLocaleString('en-US')} USDC`}
        </Button>
        {state && !state.ok ? <p className="text-xs text-red-600">{state.error}</p> : null}
        {state && state.ok ? <p className="text-xs text-brand-600">{state.message}</p> : null}
      </form>
    </Card>
  );
}
