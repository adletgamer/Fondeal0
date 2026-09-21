'use client';

import { useActionState, useState } from 'react';
import { Button } from '@fondealo/ui';
import { depositTestFunds, type DepositResult } from '@/lib/actions/wallet';
import {
  FAUCET_PRESETS_USDC,
  FUNDING_PROVIDERS,
  MAX_FAUCET_DEPOSIT_USDC,
} from '@/lib/providers/funding';

const initialState: DepositResult | null = null;

/** Pick a funding provider and an amount. Only the Testnet faucet is live; real ramps show as planned. */
export function AddFundsPanel() {
  const [state, formAction, pending] = useActionState(depositTestFunds, initialState);
  const [providerId, setProviderId] = useState('sandbox-faucet');
  const [amount, setAmount] = useState(1_000);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="providerId" value={providerId} />

      <fieldset>
        <legend className="text-xs font-medium text-slate-600">Funding provider</legend>
        <div className="mt-2 space-y-2">
          {FUNDING_PROVIDERS.map((p) => {
            const available = p.status === 'available';
            const selected = providerId === p.id;
            return (
              <label
                key={p.id}
                className={[
                  'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                  available ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                  selected ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200 bg-white',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="provider-choice"
                  className="mt-1"
                  checked={selected}
                  disabled={!available}
                  onChange={() => setProviderId(p.id)}
                />
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {p.name}
                    {!available ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Planned
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">{p.description}</span>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Fee {p.fee} · {p.eta}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label className="text-xs font-medium text-slate-600" htmlFor="deposit-amount">
          Amount (USDC)
        </label>
        <input
          id="deposit-amount"
          name="amount"
          type="number"
          min="1"
          max={MAX_FAUCET_DEPOSIT_USDC}
          step="1"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          required
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {FAUCET_PRESETS_USDC.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              {v.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending || amount <= 0}>
        {pending ? 'Adding funds…' : `Add ${amount.toLocaleString()} test USDC`}
      </Button>

      {state && !state.ok ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state && state.ok ? <p className="text-xs text-brand-600">{state.message}</p> : null}
    </form>
  );
}
