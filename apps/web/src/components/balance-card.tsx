'use client';

import { useState } from 'react';
import { Badge, Card } from '@fondealo/ui';
import type { WalletSummary } from '@/lib/wallet/ledger';
import { AddFundsPanel } from './add-funds-panel';
import { Coins } from './icons';

const KIND_LABEL: Record<string, string> = {
  Grant: 'Starting test balance',
  Deposit: 'Deposit',
  Fund: 'Funded an opportunity',
  Repay: 'Repayment sent',
  Payout: 'Received',
  Collateral: 'Collateral locked',
  CollateralReturn: 'Collateral returned',
  Withdraw: 'Withdrawal',
};

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** USDC balance + recent movements + the "add funds" flow. Testnet money — labelled as such everywhere. */
export function BalanceCard({
  summary,
  className,
}: {
  summary: WalletSummary | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!summary) {
    return (
      <Card className={`p-5 ${className ?? ''}`}>
        <p className="text-sm text-slate-500">
          Your balance is temporarily unavailable. Refresh in a moment.
        </p>
      </Card>
    );
  }

  return (
    <Card className={`p-5 ${className ?? ''}`} id="balance">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Coins width={20} height={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Available balance</span>
              <Badge variant="gold">Test funds</Badge>
            </div>
            <div className="font-display text-3xl font-bold tabular-nums text-slate-900">
              {fmt(summary.balanceUsdc)} <span className="text-lg text-slate-400">USDC</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
        >
          {open ? 'Close' : 'Add funds'}
        </button>
      </div>

      {open ? (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <AddFundsPanel />
        </div>
      ) : null}

      {summary.recent.length > 0 ? (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Recent activity
          </div>
          <ul className="space-y-1.5 text-sm">
            {summary.recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-slate-600">
                  {KIND_LABEL[r.kind] ?? r.kind}
                  {r.reference && r.kind !== 'Grant' ? (
                    <span className="text-slate-400"> · {r.reference.replace(/^[^—]*— /, '')}</span>
                  ) : null}
                </span>
                <span
                  className={`shrink-0 font-medium tabular-nums ${
                    r.amountUsdc >= 0 ? 'text-brand-600' : 'text-slate-700'
                  }`}
                >
                  {r.amountUsdc >= 0 ? '+' : ''}
                  {fmt(r.amountUsdc)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
