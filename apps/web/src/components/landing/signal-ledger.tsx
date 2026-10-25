'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@fondealo/ui';
import { Icon3D } from '@/components/brand/icon-3d';
import { content, type LayerId, type Locale, type SignalState } from './content';

/** One signal's node on the trace: filled = a source confirmed it. */
function Node({ state }: { state: SignalState }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full',
        state === 'verified' && 'bg-brand-fill text-on-brand',
        state === 'declared' && 'border-2 border-orbit bg-surface-200 text-orbit',
        state === 'pending' && 'border-2 border-dashed border-line-strong bg-surface-200',
      )}
    >
      {state === 'verified' ? (
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
          <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : state === 'declared' ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
    </span>
  );
}

/**
 * SIGNAL: the passport as layers of signals, each with its source and state.
 * A real fragment of the product (`data-ui`), labelled as a sample. Without
 * JavaScript it renders the first layer and stays readable.
 */
export function SignalLedger({ locale }: { locale: Locale }) {
  const t = content[locale].signals;
  const [layerId, setLayerId] = useState<LayerId>('identity');
  const layer = t.layers.find((l) => l.id === layerId) ?? t.layers[0]!;
  const withSource = layer.items.filter((i) => i.state === 'verified').length;
  const groupId = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + t.layers.length) % t.layers.length;
    setLayerId(t.layers[next]!.id);
    tabs.current[next]?.focus();
  }

  return (
    <div className="relative w-full min-w-0 max-w-[540px] pt-10">
      {/* Pages behind the cover: depth from tone, not shadow. */}
      <div
        aria-hidden
        className="absolute inset-x-8 bottom-[-14px] top-16 rounded-3xl bg-surface-0/70"
      />
      <div
        aria-hidden
        className="absolute inset-x-14 bottom-[-26px] top-20 rounded-3xl bg-surface-0/40"
      />

      <figure
        data-ui
        aria-label={t.passportTitle}
        className="relative rounded-3xl bg-surface-200 text-ink"
      >
        <Icon3D
          key={`icon-${layer.id}`}
          name={layer.icon}
          size={120}
          className="pointer-events-none absolute -top-14 right-3 z-20 animate-fade-up motion-reduce:animate-none"
        />

        <div className="px-6 pb-2 pt-6">
          <p className="text-[13px] font-medium text-ink-muted">{t.passportTitle}</p>
          <p className="mt-0.5 text-lg font-semibold">{t.company}</p>
          <span className="mt-2 inline-block rounded-md border border-line-strong px-2 py-0.5 text-[13px] font-medium text-ink-muted">
            {t.sample}
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label={t.layersAria}
          id={groupId}
          className="mx-4 mt-3 grid grid-cols-3 gap-1 rounded-xl bg-surface-0/50 p-1"
        >
          {t.layers.map((l, i) => {
            const selected = l.id === layerId;
            return (
              <button
                key={l.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setLayerId(l.id)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  'min-h-12 rounded-lg px-2 text-center text-[13px] font-medium leading-tight transition-colors sm:text-sm duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none',
                  selected ? 'bg-surface-100 text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        <ol key={`list-${layer.id}`} className="relative px-6 pb-2 pt-5" aria-live="polite">
          {/* The trace that links the signals. */}
          <span
            aria-hidden
            className="absolute bottom-9 left-[35px] top-8 w-px bg-line-strong/60"
          />
          {layer.items.map((s, i) => (
            <li
              key={s.name}
              style={{ animationDelay: `${i * 60}ms` }}
              className="relative flex animate-fade-up items-start gap-4 pb-5 motion-reduce:animate-none"
            >
              <Node state={s.state} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-snug">{s.name}</p>
                <p className="text-[13px] leading-snug text-ink-muted">
                  {t.sourceLabel}: {s.source}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 pt-0.5 text-[13px] font-medium',
                  s.state === 'verified' ? 'text-brand-text' : 'text-ink-muted',
                )}
              >
                {t.states[s.state]}
              </span>
            </li>
          ))}
        </ol>

        <figcaption className="flex items-center justify-between gap-4 rounded-b-3xl bg-surface-0/40 px-6 py-3.5 text-[13px] text-ink-muted">
          <span className="font-medium text-ink">{t.count(withSource, layer.items.length)}</span>
          <span>{t.sample}</span>
        </figcaption>
      </figure>
    </div>
  );
}

/** Legend for the three states, shown beside the ledger. */
export function SignalRules({ locale }: { locale: Locale }) {
  const t = content[locale].signals;
  const states: SignalState[] = ['verified', 'declared', 'pending'];
  return (
    <ul className="mt-8 space-y-3">
      {t.rules.map((rule, i) => (
        <li key={rule} className="flex items-center gap-3 text-base text-ink-muted">
          <Node state={states[i]!} />
          <span>{rule}</span>
        </li>
      ))}
    </ul>
  );
}
