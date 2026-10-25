'use client';

import { useState } from 'react';
import { maskTaxId } from '@/lib/format';

/**
 * The full tax number stays hidden until the reviewer asks for it. In
 * production that request becomes an audit event; in preview nothing is stored.
 */
export function TaxIdReveal({
  label,
  value,
  audited,
}: {
  label: string;
  value: string;
  audited: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>
        {label} {shown ? value : maskTaxId(value)}
      </span>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium underline underline-offset-4"
      >
        {shown ? 'Ocultar' : 'Mostrar completo'}
      </button>
      {shown ? (
        <span role="status" className="text-[13px] text-ink-muted">
          {audited ? 'Este acceso queda registrado.' : 'Vista previa: este acceso no se registra.'}
        </span>
      ) : null}
    </div>
  );
}
