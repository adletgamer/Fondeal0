import Link from 'next/link';
import { cn } from '@fondealo/ui';
import type { CaseView } from '@/lib/cases';
import { ageLabel, maskTaxId } from '@/lib/format';
import { STATUS_LABEL } from '@/lib/kyb/states';
import type { CaseStatus } from '@/lib/kyb/types';
import { StatusChip } from './status-chip';

export const FILTERS: { id: string; label: string; match: (s: CaseStatus) => boolean }[] = [
  { id: 'todos', label: 'Todos', match: () => true },
  { id: 'por-revisar', label: 'Por revisar', match: (s) => s === 'Received' || s === 'InReview' },
  { id: 'falta-informacion', label: 'Falta información', match: (s) => s === 'NeedsInformation' },
  { id: 'aprobados', label: 'Aprobados', match: (s) => s === 'Approved' },
  { id: 'rechazados', label: 'Rechazados', match: (s) => s === 'Rejected' },
];

/** The review queue: oldest first, so nothing waits behind newer cases. */
export function CaseQueue({
  cases,
  filter,
  now,
}: {
  cases: CaseView[];
  filter: string;
  now: Date;
}) {
  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0]!;
  const rows = cases.filter((c) => active.match(c.status));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Cola de revisión</h1>
      <p className="mt-1 max-w-2xl text-ink-muted">
        Solicitudes de empresas, de la más antigua a la más reciente. Aprobar aquí confirma la
        identidad de la empresa; no aprueba financiamiento.
      </p>

      <nav aria-label="Filtrar por estado" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = cases.filter((c) => f.match(c.status)).length;
          const on = f.id === active.id;
          return (
            <Link
              key={f.id}
              href={f.id === 'todos' ? '/' : `/?estado=${f.id}`}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
                on ? 'bg-surface-200 text-ink' : 'bg-surface-100 text-ink-muted hover:text-ink',
              )}
            >
              {f.label}
              <span className="text-ink-muted">{n}</span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-surface-100 px-6 py-10 text-center text-ink-muted">
          No hay casos en “{active.label}”.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-surface-100">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Casos de revisión KYB</caption>
            <thead className="text-[13px] text-ink-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Empresa
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Número tributario
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Recibido
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Estado
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Asignado
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-surface-200/40">
                  <th scope="row" className="px-5 py-3.5 font-medium">
                    <Link
                      href={`/cases/${c.id}`}
                      className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                    >
                      {c.legalName}
                      <span className="sr-only">, {STATUS_LABEL[c.status]}</span>
                    </Link>
                  </th>
                  <td className="px-3 py-3.5 text-ink-muted">
                    {c.taxIdLabel} {maskTaxId(c.taxId)}
                  </td>
                  <td className="px-3 py-3.5 text-ink-muted">{ageLabel(c.submittedAt, now)}</td>
                  <td className="px-3 py-3.5">
                    <StatusChip status={c.status} />
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">{c.assignedTo ?? 'Sin asignar'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
