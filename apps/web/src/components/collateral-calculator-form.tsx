'use client';

import { useActionState, useMemo, useState } from 'react';
import { Button, Card, Field, TextField } from '@fondealo/ui';
import {
  buildRepaymentSchedule,
  COLLATERAL_CONFIG_V1,
  maxProtectedPct,
  requiredCollateral,
  type RiskBand,
} from '@fondealo/types';
import { createOpportunityOnChainAware, type ActionResult } from '@/lib/actions/opportunities';

const initialState: ActionResult | null = null;

function installmentsFor(termDays: number): number {
  return Math.max(1, Math.min(12, Math.round(termDays / 30)));
}

export function CollateralCalculatorForm({
  businessAddress,
  riskBand,
}: {
  businessAddress: string;
  riskBand: RiskBand;
}) {
  const [state, formAction, pending] = useActionState(createOpportunityOnChainAware, initialState);
  const [amount, setAmount] = useState(5000);
  const [termDays, setTermDays] = useState(90);
  const config = COLLATERAL_CONFIG_V1[riskBand];
  const [aprBps, setAprBps] = useState(config.suggestedAprBps);

  const collateral = useMemo(
    () => (amount > 0 ? Number(requiredCollateral(String(amount), riskBand)) : 0),
    [amount, riskBand],
  );
  const protectedPct = maxProtectedPct(riskBand);
  const schedule = useMemo(() => {
    if (amount <= 0 || termDays <= 0) return [];
    return buildRepaymentSchedule(String(amount), aprBps, termDays, installmentsFor(termDays));
  }, [amount, aprBps, termDays]);
  const totalDue = schedule.reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Request financing</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your Passport&apos;s current band (<strong>{riskBand}</strong>) sets your collateral —
          this is not a choice, it&apos;s earned.
        </p>

        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="businessAddress" value={businessAddress} />
          <input type="hidden" name="riskBand" value={riskBand} />
          <Field
            label="Legal / trade name"
            name="legalName"
            placeholder="Bodega San Martín"
            required
          />
          <Field label="Country" name="country" placeholder="Perú" required />
          <Field label="Opportunity title" name="title" placeholder="Inventory financing — Lima" required />
          <TextField label="Description" name="description" placeholder="What is the financing for?" rows={2} />

          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label="Amount"
              name="amount"
              type="number"
              min="1"
              step="1"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              hint="USDC"
              required
            />
            <Field
              label="Term"
              name="termDays"
              type="number"
              min="1"
              value={termDays || ''}
              onChange={(e) => setTermDays(Number(e.target.value) || 0)}
              hint="days"
              required
            />
            <Field
              label="APR"
              name="aprBps"
              type="number"
              min="0"
              value={aprBps || ''}
              onChange={(e) => setAprBps(Number(e.target.value) || 0)}
              hint={`bps — suggested ${config.suggestedAprBps}`}
              required
            />
          </div>

          <Button type="submit" disabled={pending || amount <= 0}>
            {pending ? 'Locking collateral…' : `Lock ${collateral.toLocaleString()} USDC & create`}
          </Button>

          {state && !state.ok ? <p className="text-xs text-red-600">{state.error}</p> : null}
          {state && state.ok ? <p className="text-xs text-brand-600">{state.message}</p> : null}
        </form>
      </Card>

      <Card className="h-fit p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Live collateral calculator
        </h3>

        <div className="mt-4 space-y-4">
          <Row label="Requested amount" value={`${amount.toLocaleString()} USDC`} />
          <Row
            label={`Required collateral (band ${riskBand}, ${config.collateralRatioBps / 100}%)`}
            value={`${collateral.toLocaleString()} USDC`}
            accent
          />
          <Row label="Investor protection" value={`${protectedPct}% of principal`} />
          <Row label="Suggested APR" value={`${(config.suggestedAprBps / 100).toFixed(1)}%`} />
          <Row
            label={`Total to repay over ${termDays}d`}
            value={`${totalDue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`}
          />
        </div>

        <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50/60 p-3 text-sm text-brand-800">
          You will lock <strong>{collateral.toLocaleString()} USDC</strong> of your own working
          capital. Repay in full and it comes straight back — plus your score goes up, which lowers
          this ratio on your next loan.
        </div>

        {schedule.length > 0 ? (
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Repayment preview
            </div>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {schedule.slice(0, 4).map((s) => (
                <li key={s.index} className="flex justify-between">
                  <span>Day {s.dueInDays}</span>
                  <span className="font-medium text-slate-700">
                    {Number(s.total).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                  </span>
                </li>
              ))}
              {schedule.length > 4 ? (
                <li className="text-slate-400">+ {schedule.length - 4} more installments</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-brand-700' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}
