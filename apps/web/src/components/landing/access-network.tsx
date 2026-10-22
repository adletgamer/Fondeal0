'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@fondealo/ui';
import { Icon3D } from '@/components/brand/icon-3d';
import { content, type LayerId, type Locale, type RecipientId } from './content';

const LAYER_ORDER: LayerId[] = ['identity', 'activity', 'finance'];

const INITIAL: Record<RecipientId, LayerId[]> = {
  fund: ['identity', 'activity'],
  lender: ['identity'],
  accelerator: [],
};

// Geometry of the connector column (lg and up): three equal rows.
const ROW = 104;
const GAP = 20;
const H = ROW * 3 + GAP * 2;
const centre = (i: number) => ROW / 2 + i * (ROW + GAP);

/**
 * NETWORK + permissioned access, the page's one live thing: the visitor
 * chooses which layers of a sample passport each recipient receives and reads
 * exactly what that recipient gets. Sample recipients only; no real names.
 * Without JavaScript it renders the starting state and stays readable.
 */
export function AccessNetwork({ locale }: { locale: Locale }) {
  const t = content[locale].access;
  const [grants, setGrants] = useState(INITIAL);
  const [selected, setSelected] = useState<RecipientId>('fund');
  const [notice, setNotice] = useState<string | null>(null);
  const groupId = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const current = t.recipients.find((r) => r.id === selected) ?? t.recipients[0]!;
  const layers = grants[selected];
  const labels = LAYER_ORDER.filter((l) => layers.includes(l)).map((l) => t.layerLabels[l]);
  const summary = notice
    ? notice
    : labels.length
      ? t.receives(current.name, labels.join(', '))
      : t.receivesNothing(current.name);

  function toggle(layer: LayerId) {
    setNotice(null);
    setGrants((g) => ({
      ...g,
      [selected]: g[selected].includes(layer)
        ? g[selected].filter((l) => l !== layer)
        : [...g[selected], layer],
    }));
  }

  function revoke() {
    setGrants((g) => ({ ...g, [selected]: [] }));
    setNotice(t.revoked(current.name));
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? -1
          : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + t.recipients.length) % t.recipients.length;
    setSelected(t.recipients[next]!.id);
    setNotice(null);
    tabs.current[next]?.focus();
  }

  return (
    <div data-ui className="text-ink">
      <div className="grid items-center gap-8 lg:grid-cols-[170px_1fr_minmax(0,330px)] lg:gap-0">
        {/* The company */}
        <div className="flex items-center gap-4 lg:flex-col lg:gap-2 lg:text-center">
          <Icon3D name="company" size={120} className="h-24 w-24 lg:h-[120px] lg:w-[120px]" />
          <div>
            <p className="text-base font-semibold">{t.company}</p>
            <p className="text-[13px] text-ink-muted">{t.sample}</p>
          </div>
        </div>

        {/* The links: solid and carrying signals when there is access, dotted when there is none. */}
        <svg
          aria-hidden
          viewBox={`0 0 100 ${H}`}
          preserveAspectRatio="none"
          className="hidden w-full lg:block"
          style={{ height: H }}
        >
          {t.recipients.map((r, i) => {
            const n = grants[r.id].length;
            const on = n > 0;
            const y = centre(i);
            return (
              <path
                key={r.id}
                d={`M 0 ${H / 2} C 55 ${H / 2}, 45 ${y}, 100 ${y}`}
                vectorEffect="non-scaling-stroke"
                fill="none"
                strokeLinecap="round"
                strokeWidth={on ? 1.5 + n : 1.5}
                strokeDasharray={on ? '1 9' : '2 8'}
                className={cn(
                  'transition-[stroke-width,opacity] duration-300 motion-reduce:transition-none',
                  on ? 'stroke-brand-fill network-flow' : 'stroke-line-strong',
                  r.id === selected ? 'opacity-100' : on ? 'opacity-70' : 'opacity-60',
                )}
              />
            );
          })}
        </svg>

        {/* The recipients */}
        <div
          role="radiogroup"
          aria-label={t.recipientsAria}
          id={groupId}
          className="flex flex-col gap-5"
        >
          {t.recipients.map((r, i) => {
            const isSelected = r.id === selected;
            const n = grants[r.id].length;
            return (
              <button
                key={r.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  setSelected(r.id);
                  setNotice(null);
                }}
                onKeyDown={(e) => onKey(e, i)}
                style={{ minHeight: ROW }}
                className={cn(
                  'flex items-center gap-4 rounded-2xl px-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none',
                  isSelected ? 'bg-surface-200' : 'bg-surface-100 hover:bg-surface-200/60',
                )}
              >
                <Icon3D name={r.icon} size={72} className="h-[72px] w-[72px] shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold leading-snug">{r.name}</span>
                  <span className="block text-[13px] text-ink-muted">{r.kind}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-[13px] font-medium',
                    n ? 'bg-brand-soft text-brand-text' : 'bg-surface-0/60 text-ink-muted',
                  )}
                >
                  {n}/{LAYER_ORDER.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* What the selected recipient receives */}
      <div className="mt-8 rounded-2xl bg-surface-200 p-5 sm:p-6">
        <div role="group" aria-label={t.layersAria} className="flex flex-wrap gap-2">
          {LAYER_ORDER.map((l) => {
            const on = layers.includes(l);
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(l)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none',
                  on
                    ? 'bg-brand-fill text-on-brand'
                    : 'bg-surface-0/60 text-ink-muted hover:text-ink',
                )}
              >
                <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none">
                  {on ? (
                    <path
                      d="m3.5 8.5 3 3 6-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  ) : (
                    <path
                      d="M3.5 8h9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                {t.layerLabels[l]}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p aria-live="polite" className="min-w-0 flex-1 text-base font-medium">
            {summary}
          </p>
          <button
            type="button"
            onClick={revoke}
            disabled={layers.length === 0}
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-40"
          >
            {t.revoke}
          </button>
        </div>
      </div>
    </div>
  );
}
