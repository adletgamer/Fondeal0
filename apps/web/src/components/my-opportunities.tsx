'use client';

import { useActionState } from 'react';
import { Button } from '@fondealo/ui';
import type { Opportunity, OpportunityStatus } from '@fondealo/types';
import { listBusinessOpportunities } from '@/lib/actions/opportunities';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

const statusTone: Record<OpportunityStatus, string> = {
  Draft: 'border-slate-300 text-slate-600',
  Open: 'border-brand-300 text-brand-700',
  Funded: 'border-brand-400 text-brand-700',
  Active: 'border-gold-400 text-gold-600',
  Repaid: 'border-emerald-400 text-emerald-700',
  Defaulted: 'border-red-300 text-red-600',
  Cancelled: 'border-slate-300 text-slate-400',
};

type State = { ok: true; opportunities: Opportunity[] } | { ok: false; error: string } | null;

/**
 * "Where does my request stand?" — a business owner who just submitted an
 * opportunity should never land back on a blank form with no way to check
 * status. Since there's no session yet (SEP-10 is Month 1 on the roadmap),
 * this looks itself up by Stellar address instead of by an authenticated user.
 */
export function MyOpportunities() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    listBusinessOpportunities,
    null,
  );

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <input
          name="businessAddress"
          placeholder="Your Stellar address (G…)"
          className={`${inputClass} flex-1 font-mono`}
          required
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Buscando…' : 'Ver mis solicitudes'}
        </Button>
      </form>

      {state && !state.ok ? <p className="mt-2 text-xs text-red-600">{state.error}</p> : null}

      {state && state.ok ? (
        state.opportunities.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No encontramos solicitudes para esa dirección todavía.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {state.opportunities.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800">{o.title}</div>
                  <div className="text-xs text-slate-500">
                    {Number(o.funded).toLocaleString()} / {Number(o.amount).toLocaleString()} USDC
                    &nbsp;· {o.termDays}d · {(o.aprBps / 100).toFixed(1)}% APR
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border bg-white px-2.5 py-1 text-xs font-semibold ${statusTone[o.status]}`}
                >
                  {o.status}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
