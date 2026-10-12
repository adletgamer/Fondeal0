'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Button, Card, Field, TxStatus } from '@fondealo/ui';
import { useStellarWallet } from '@/hooks/use-stellar-wallet';
import { fundOpportunityOnChainAware, type ActionResult } from '@/lib/actions/opportunities';

/**
 * Funding currently uses the server's guarded demo ledger. The previous
 * client-first chain attempt could move tokens before the server checked
 * underwriting eligibility. Restore chain funding only after the escrow
 * contract enforces the same gate and reconciliation is atomic/idempotent.
 */
export function FundPanel({
  opportunityId,
  remaining,
  aprBps,
  termDays,
  isOpen,
  balanceUsdc,
}: {
  opportunityId: string;
  remaining: number;
  aprBps: number;
  termDays: number;
  isOpen: boolean;
  balanceUsdc: number | null;
}) {
  const { stellarAddress } = useStellarWallet();
  const [amount, setAmount] = useState(remaining > 0 ? Math.min(remaining, 500) : 0);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const projectedReturn = useMemo(() => {
    const interest = (amount * aprBps * termDays) / (10_000 * 365);
    return amount + interest;
  }, [amount, aprBps, termDays]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stellarAddress || amount <= 0) return;
    setPending(true);
    setResult(null);

    const formData = new FormData();
    formData.set('opportunityId', opportunityId);
    formData.set('amount', String(amount));
    const dbResult = await fundOpportunityOnChainAware(null, formData);

    setPending(false);
    setResult(dbResult);
  }

  const insufficient = balanceUsdc !== null && amount > balanceUsdc;

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
      <p className="mt-1 text-sm text-slate-500">
        {remaining.toLocaleString('en-US')} USDC remaining.
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

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {stellarAddress ? (
          <p className="text-xs text-slate-500">
            Funding as{' '}
            <span className="font-mono text-slate-700">
              {stellarAddress.slice(0, 6)}…{stellarAddress.slice(-6)}
            </span>
          </p>
        ) : null}
        <Field
          label="Amount"
          name="amount"
          type="number"
          min="1"
          max={remaining || undefined}
          step="1"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          unit="USDC"
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
              {projectedReturn.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC
            </span>
          </div>
        </div>

        {insufficient ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Not enough balance for this amount.{' '}
            <a href="/invest#balance" className="font-medium underline">
              Add test funds
            </a>
          </p>
        ) : null}

        <Button
          type="submit"
          variant="gold"
          className="w-full"
          disabled={pending || amount <= 0 || !stellarAddress || insufficient}
        >
          {pending ? 'Funding…' : `Fund ${amount.toLocaleString('en-US')} USDC`}
        </Button>

        {pending ? (
          <TxStatus state="pending" label="Recording test funding" />
        ) : result ? (
          <TxStatus
            state={result.ok ? 'confirmed' : 'failed'}
            label={result.ok ? 'Recorded' : undefined}
            meta={result.ok ? result.message : result.error}
          />
        ) : null}
      </form>
    </Card>
  );
}
