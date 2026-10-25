import type { ReactNode } from 'react';
import { Badge } from '@fondealo/ui';
import type { CaseView, EvidenceState } from '@/lib/cases';
import { ageLabel, formatDateTime } from '@/lib/format';
import { SOURCE_LABEL } from '@/lib/kyb/policy';
import type { EvidenceSource } from '@/lib/kyb/types';
import { Panel } from './panel';
import { TaxIdReveal } from './tax-id-reveal';

const SOURCE_VARIANT = {
  'official-registry': 'brand',
  'third-party': 'brand',
  'reviewer-attested': 'info',
  'declared-only': 'neutral',
  synthetic: 'gold',
} as const satisfies Record<EvidenceSource, 'brand' | 'info' | 'neutral' | 'gold'>;

const STATE_LABEL: Record<EvidenceState, string> = {
  Declared: 'Declarada',
  Verified: 'Verificada',
  Unavailable: 'No disponible',
};

export function CompanyPanel({ c, audited }: { c: CaseView; audited: boolean }) {
  const rows: [string, ReactNode][] = [
    ['País', c.country],
    [
      'Número tributario',
      <TaxIdReveal key="t" label={c.taxIdLabel} value={c.taxId} audited={audited} />,
    ],
    ['Sector', c.sector],
    ['Año de fundación', String(c.foundedYear)],
    ['Consentimiento', c.consentVersion],
  ];
  return (
    <Panel id="company" title="Empresa">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[180px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-sm text-ink-muted">{k}</dt>
            <dd className="text-sm font-medium">{v}</dd>
          </div>
        ))}
        <dt className="text-sm text-ink-muted">Representante</dt>
        <dd className="text-sm font-medium">
          {c.representative.name}
          <span className="font-normal text-ink-muted">
            {' '}
            · {c.representative.role} · documento ••••{c.representative.documentTail}
          </span>
        </dd>
      </dl>
    </Panel>
  );
}

export function EvidencePanel({ c }: { c: CaseView }) {
  return (
    <Panel id="evidence" title="Evidencia">
      <p className="text-sm text-ink-muted">
        Por ahora todo es declarado: no se suben documentos. Una declaración no confirma ningún
        punto de la política.
      </p>
      <ul className="mt-4 divide-y divide-line">
        {c.evidence.map((e) => (
          <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{e.label}</p>
              <p className="text-[13px] text-ink-muted">{e.detail}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Badge variant={SOURCE_VARIANT[e.source]}>{SOURCE_LABEL[e.source]}</Badge>
              <Badge variant={e.state === 'Verified' ? 'brand' : 'neutral'}>
                {STATE_LABEL[e.state]}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function ChecksPanel({ c }: { c: CaseView }) {
  return (
    <Panel id="checks" title="Verificaciones del sistema">
      <ul className="divide-y divide-line">
        {c.checks.map((k) => (
          <li key={k.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{k.checkType}</p>
              <p className="text-[13px] text-ink-muted">
                {k.provider} · {k.detail}
              </p>
            </div>
            <Badge variant="neutral">{k.result}</Badge>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function Timeline({ c, now }: { c: CaseView; now: Date }) {
  return (
    <Panel id="timeline" title="Historial">
      <ol className="space-y-4">
        {[...c.timeline].reverse().map((t) => (
          <li key={`${t.at}-${t.text}`} className="grid gap-0.5 border-l-2 border-line pl-4">
            <p className="text-sm">{t.text}</p>
            <p className="text-[13px] text-ink-muted">
              {t.actor} · {formatDateTime(t.at)} ({ageLabel(t.at, now)})
            </p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
