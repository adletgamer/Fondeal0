'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { Button, cn } from '@fondealo/ui';
import { validateDecision } from '@/lib/kyb/decision';
import { POLICY_ITEMS, POLICY_VERSION, SOURCE_LABEL, acceptedSources } from '@/lib/kyb/policy';
import { reasonCode, reasonsFor } from '@/lib/kyb/reason-codes';
import { STATUS_LABEL, allowedKinds } from '@/lib/kyb/states';
import type {
  AdminEnv,
  CaseStatus,
  ChecklistAnswer,
  DecisionKind,
  EvidenceSource,
  Actor,
  SeparationMode,
} from '@/lib/kyb/types';

const ACTION_LABEL: Record<DecisionKind, string> = {
  Claim: 'Tomar el caso',
  RequestInformation: 'Pedir información',
  Approve: 'Aprobar KYB',
  Reject: 'Rechazar',
  Reopen: 'Reabrir',
};

const field =
  'w-full rounded-lg border border-line-strong bg-surface-0 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint';

type Stage = 'edit' | 'confirm' | 'done';

const blank = (): Record<string, ChecklistAnswer> =>
  Object.fromEntries(
    POLICY_ITEMS.map((i) => [
      i.id,
      { itemId: i.id, outcome: 'NotChecked', source: null, note: '' },
    ]),
  );

/**
 * Where a reviewer records a decision. It runs the same `validateDecision` the
 * server will run, so the screen explains exactly what is missing, and it only
 * promises what the back-office really does today (`capabilities`).
 */
export function DecisionPanel({
  legalName,
  status,
  actor,
  preparedBy,
  separation,
  env,
  capabilities,
}: {
  legalName: string;
  status: CaseStatus;
  actor: Actor;
  preparedBy: string | null;
  separation: SeparationMode;
  env: AdminEnv;
  capabilities: { persistsDecisions: boolean; queuesPassportIssuance: boolean };
}) {
  const [kind, setKind] = useState<DecisionKind | null>(null);
  const [answers, setAnswers] = useState(blank);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<Stage>('edit');
  const [attempted, setAttempted] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const uid = useId();

  const kinds = allowedKinds(status);
  const sources = acceptedSources(env);

  const check = useMemo(
    () =>
      kind
        ? validateDecision({
            kind,
            from: status,
            actor,
            preparedBy,
            separation,
            checklist: Object.values(answers),
            reasonCodes: reasons,
            note,
            env,
          })
        : null,
    [kind, status, actor, preparedBy, separation, answers, reasons, note, env],
  );

  function go(next: Stage) {
    setStage(next);
    // Move focus to the new step so a screen reader announces it.
    queueMicrotask(() => heading.current?.focus());
  }

  function reset() {
    setKind(null);
    setAnswers(blank());
    setReasons([]);
    setNote('');
    setAttempted(false);
    go('edit');
  }

  function patch(id: string, p: Partial<ChecklistAnswer>) {
    setAnswers((a) => ({ ...a, [id]: { ...a[id]!, ...p } }));
  }

  const chooseKind = (k: DecisionKind) => {
    setKind(k);
    setReasons([]);
    setAttempted(false);
  };

  return (
    <section aria-labelledby={`${uid}-title`} className="rounded-2xl bg-surface-200 p-5 sm:p-6">
      <h2
        id={`${uid}-title`}
        ref={heading}
        tabIndex={-1}
        className="text-base font-semibold focus:outline-none"
      >
        {stage === 'edit'
          ? 'Decisión'
          : stage === 'confirm'
            ? 'Confirma la decisión'
            : 'Decisión simulada'}
      </h2>
      <p className="mt-1 text-[13px] text-ink-muted">
        Estado actual: {STATUS_LABEL[status]} · Política {POLICY_VERSION}
      </p>
      {separation === 'solo' && preparedBy === actor.id ? (
        <p className="mt-3 rounded-xl bg-gold-soft p-3 text-[13px] text-gold-text">
          Modo de un solo operador (Testnet): preparaste este caso y también puedes decidirlo. En
          producción debe decidirlo otra persona.
        </p>
      ) : null}

      {stage === 'edit' ? (
        <div className="mt-5 space-y-6">
          <div role="radiogroup" aria-label="Acción" className="grid gap-2">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => chooseKind(k)}
                className={cn(
                  'min-h-11 rounded-lg px-4 text-left text-sm font-medium transition-colors',
                  kind === k
                    ? 'bg-brand-fill text-on-brand'
                    : 'bg-surface-0/60 text-ink hover:bg-surface-0',
                )}
              >
                {ACTION_LABEL[k]}
              </button>
            ))}
          </div>

          {kind === 'Approve' ? (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">
                Confirma cada punto con una fuente que lo respalde. “Solo declarado” no cuenta.
              </p>
              {POLICY_ITEMS.map((item) => {
                const a = answers[item.id]!;
                const name = `${uid}-${item.id}`;
                return (
                  <fieldset key={item.id} className="rounded-xl bg-surface-0/50 p-4">
                    <legend className="px-1 text-sm font-medium">
                      {item.label}
                      {item.required ? null : (
                        <span className="font-normal text-ink-muted"> (opcional)</span>
                      )}
                    </legend>
                    <p className="text-[13px] text-ink-muted">{item.hint}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                      {(['Confirmed', 'NotConfirmed'] as const).map((o) => (
                        <label key={o} className="inline-flex min-h-11 items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={name}
                            checked={a.outcome === o}
                            onChange={() =>
                              patch(item.id, {
                                outcome: o,
                                source: o === 'Confirmed' ? a.source : null,
                              })
                            }
                            className="h-4 w-4 accent-[rgb(var(--brand-fill))]"
                          />
                          {o === 'Confirmed' ? 'Confirmado' : 'No confirmado'}
                        </label>
                      ))}
                    </div>
                    {a.outcome === 'Confirmed' ? (
                      <div className="mt-2 space-y-3">
                        <label className="block text-sm">
                          <span className="mb-1 block text-ink-muted">Fuente</span>
                          <select
                            className={field}
                            value={a.source ?? ''}
                            onChange={(e) =>
                              patch(item.id, {
                                source: (e.target.value || null) as EvidenceSource | null,
                              })
                            }
                          >
                            <option value="">Elige una fuente…</option>
                            {sources.map((s) => (
                              <option key={s} value={s}>
                                {SOURCE_LABEL[s]}
                              </option>
                            ))}
                            <option value="declared-only">{SOURCE_LABEL['declared-only']}</option>
                          </select>
                        </label>
                        {a.source === 'reviewer-attested' ? (
                          <label className="block text-sm">
                            <span className="mb-1 block text-ink-muted">
                              Qué revisaste, dónde y cuándo
                            </span>
                            <textarea
                              className={field}
                              rows={2}
                              value={a.note}
                              onChange={(e) => patch(item.id, { note: e.target.value })}
                              placeholder="Ej.: Consulté la ficha RUC en el portal tributario el 22/10; activo y habido."
                            />
                          </label>
                        ) : null}
                      </div>
                    ) : null}
                  </fieldset>
                );
              })}
            </div>
          ) : null}

          {kind === 'RequestInformation' || kind === 'Reject' ? (
            <fieldset className="space-y-1">
              <legend className="text-sm font-medium">Motivo</legend>
              {reasonsFor(kind).map((r) => (
                <label key={r.code} className="flex min-h-11 items-start gap-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={reasons.includes(r.code)}
                    onChange={(e) =>
                      setReasons((rs) =>
                        e.target.checked ? [...rs, r.code] : rs.filter((c) => c !== r.code),
                      )
                    }
                    className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand-fill))]"
                  />
                  <span>{r.internal}</span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {kind === 'RequestInformation' || kind === 'Reject' || kind === 'Reopen' ? (
            <label className="block text-sm">
              <span className="mb-1 block text-ink-muted">
                {kind === 'Reopen' ? 'Por qué se reabre' : 'Nota interna'}
              </span>
              <textarea
                className={field}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          ) : null}

          {attempted && check && !check.ok ? (
            <div role="alert" className="rounded-xl bg-danger-soft p-4 text-sm text-danger-text">
              <p className="font-medium">Antes de continuar:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {check.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {kind ? (
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setAttempted(true);
                if (check?.ok) go('confirm');
              }}
            >
              Revisar y confirmar
            </Button>
          ) : null}
        </div>
      ) : null}

      {stage === 'confirm' && kind && check?.ok ? (
        <div className="mt-5 space-y-5 text-sm">
          <p>
            Vas a <strong>{ACTION_LABEL[kind].toLowerCase()}</strong> a {legalName}. El caso pasará
            a <strong>{STATUS_LABEL[check.to]}</strong>.
          </p>

          {kind === 'Approve' ? (
            <ul className="space-y-1.5 rounded-xl bg-surface-0/50 p-4">
              {POLICY_ITEMS.filter((i) => answers[i.id]!.outcome === 'Confirmed').map((i) => (
                <li key={i.id}>
                  {i.label} ·{' '}
                  <span className="text-ink-muted">{SOURCE_LABEL[answers[i.id]!.source!]}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {check.reasonCodes.length > 0 ? (
            <div className="rounded-xl bg-surface-0/50 p-4">
              <p className="text-[13px] text-ink-muted">Lo que verá la empresa</p>
              <ul className="mt-1 space-y-1">
                {check.reasonCodes.map((c) => (
                  <li key={c}>{reasonCode(c)?.userMessage}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {kind === 'Approve' ? (
            <p className="text-ink-muted">
              Esto confirma la identidad de la empresa. <strong>No aprueba financiamiento</strong>:
              el riesgo se decide aparte.
            </p>
          ) : null}

          {!capabilities.persistsDecisions ? (
            <p className="rounded-xl bg-info-soft p-4 text-info-text">
              Vista previa: no se guarda la decisión
              {kind === 'Approve' && !capabilities.queuesPassportIssuance
                ? ' y no se emite ningún Pasaporte'
                : ''}
              .
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => go('edit')}>
              Volver
            </Button>
            <Button type="button" onClick={() => go('done')}>
              Confirmar
            </Button>
          </div>
        </div>
      ) : null}

      {stage === 'done' && kind && check?.ok ? (
        <div className="mt-5 space-y-4 text-sm" role="status">
          <p>
            Simulación completa: {legalName} quedaría en <strong>{STATUS_LABEL[check.to]}</strong>.
            No se guardó nada.
          </p>
          <Button type="button" variant="outline" onClick={reset}>
            Probar otra decisión
          </Button>
        </div>
      ) : null}
    </section>
  );
}
