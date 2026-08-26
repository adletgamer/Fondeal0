'use client';

import { useActionState } from 'react';
import { Button } from '@fondealo/ui';
import { RiskBand } from '@fondealo/types';
import { createOpportunity, type ActionResult } from '@/lib/actions/opportunities';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

const initialState: ActionResult | null = null;

/** Opens a real funding opportunity via the Phase 6 Server Action (Prisma-backed). */
export function CreateOpportunityForm() {
  const [state, formAction, pending] = useActionState(createOpportunity, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="businessAddress"
          placeholder="Your Stellar address (G…)"
          className={`${inputClass} font-mono sm:col-span-2`}
          required
        />
        <input name="legalName" placeholder="Legal / trade name" className={inputClass} required />
        <input name="country" placeholder="Country" className={inputClass} required />
      </div>
      <input name="title" placeholder="Opportunity title" className={inputClass} required />
      <textarea
        name="description"
        placeholder="What is the financing for?"
        rows={2}
        className={inputClass}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          name="amount"
          type="number"
          min="1"
          step="1"
          placeholder="Amount (USDC)"
          className={inputClass}
          required
        />
        <input
          name="termDays"
          type="number"
          min="1"
          placeholder="Term (days)"
          className={inputClass}
          required
        />
        <input
          name="aprBps"
          type="number"
          min="0"
          placeholder="APR bps (1800 = 18%)"
          className={inputClass}
          required
        />
      </div>
      <select name="riskBand" className={inputClass} defaultValue={RiskBand.C} required>
        {Object.values(RiskBand).map((band) => (
          <option key={band} value={band}>
            Risk band {band}
          </option>
        ))}
      </select>

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create opportunity'}
      </Button>

      {state && !state.ok ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state && state.ok ? <p className="text-xs text-brand-600">{state.message}</p> : null}
    </form>
  );
}
