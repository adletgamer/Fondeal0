'use client';
import { useAppTranslation } from './app-locale-provider';

import { useActionState, useState } from 'react';
import { Button, Card, Field, TxStatus } from '@fondealo/ui';
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
  const t = useAppTranslation();

  const [state, formAction, pending] = useActionState(repayOpportunity, initialState);
  const [amount, setAmount] = useState(remaining);
  const insufficient = balanceUsdc !== null && amount > balanceUsdc;

  if (remaining <= 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t('Loan settled')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('Nothing left to repay on this loan.')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">{t('Make a payment')}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {remaining.toLocaleString(t('__locale'))} {t('USDC left to repay.')}
        {balanceUsdc !== null ? (
          <>
            {' '}
            {t('Your balance:')}{' '}
            <strong className="text-slate-700">
              {balanceUsdc.toLocaleString(t('__locale'))} USDC
            </strong>{' '}
            <span className="text-slate-400">{t('(test funds)')}</span>
          </>
        ) : null}
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="opportunityId" value={opportunityId} />
        <Field
          label={t('Amount')}
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          max={remaining}
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          unit="USDC"
          required
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAmount(remaining)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
          >
            {t('Pay it off (')}
            {remaining.toLocaleString(t('__locale'))})
          </button>
        </div>
        {insufficient ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t('Not enough balance for this payment.')}{' '}
            <a href="/business#balance" className="font-medium underline">
              {t('Add test funds')}
            </a>
          </p>
        ) : null}
        <Button
          type="submit"
          variant="gold"
          className="w-full"
          disabled={pending || amount <= 0 || insufficient}
        >
          {pending
            ? t('Paying…')
            : t('Pay {p0} USDC', { p0: amount.toLocaleString(t('__locale')) })}
        </Button>
        {pending ? (
          <TxStatus state="pending" label={t('Submitting payment')} />
        ) : state ? (
          <TxStatus
            state={state.ok ? 'confirmed' : 'failed'}
            // Repayments are recorded off-chain for now: never claim a ledger confirmation.
            label={state.ok ? t('Recorded') : undefined}
            meta={state.ok ? t(state.message) : t.error(state.error)}
          />
        ) : null}
      </form>
    </Card>
  );
}
