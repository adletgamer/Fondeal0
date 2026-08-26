'use client';

import { useActionState } from 'react';
import { Button, Field, SelectField, TextField } from '@fondealo/ui';
import { RiskBand } from '@fondealo/types';
import { createOpportunity, type ActionResult } from '@/lib/actions/opportunities';

const initialState: ActionResult | null = null;

/** Opens a real funding opportunity via the Phase 6 Server Action (Prisma-backed). */
export function CreateOpportunityForm() {
  const [state, formAction, pending] = useActionState(createOpportunity, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <Field
        label="Your Stellar address"
        name="businessAddress"
        placeholder="G…"
        inputClassName="font-mono"
        hint="No hay sesión de wallet todavía (llega en el Mes 1 del roadmap) — por ahora identifica tu negocio con la dirección."
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Legal / trade name" name="legalName" placeholder="Bodega San Martín" required />
        <Field label="Country" name="country" placeholder="Perú" required />
      </div>
      <Field label="Opportunity title" name="title" placeholder="Inventory financing — Lima" required />
      <TextField
        label="Description"
        name="description"
        placeholder="What is the financing for?"
        rows={2}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label="Amount"
          name="amount"
          type="number"
          min="1"
          step="1"
          placeholder="5000"
          hint="USDC"
          required
        />
        <Field
          label="Term"
          name="termDays"
          type="number"
          min="1"
          placeholder="90"
          hint="days"
          required
        />
        <Field
          label="APR"
          name="aprBps"
          type="number"
          min="0"
          placeholder="1800"
          hint="basis points — 1800 = 18%"
          required
        />
      </div>
      <SelectField
        label="Risk band"
        name="riskBand"
        defaultValue={RiskBand.C}
        hint="Sin score en cadena todavía para negocios nuevos — la banda es autodeclarada hasta el Mes 1."
        required
      >
        {Object.values(RiskBand).map((band) => (
          <option key={band} value={band}>
            {band}
          </option>
        ))}
      </SelectField>

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create opportunity'}
      </Button>

      {state && !state.ok ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state && state.ok ? <p className="text-xs text-brand-600">{state.message}</p> : null}
    </form>
  );
}
