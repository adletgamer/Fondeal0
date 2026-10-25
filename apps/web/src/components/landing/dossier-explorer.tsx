'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@fondealo/ui';
import { content, type Locale, type StageId } from './content';

function StatusMark({ ready, locale }: { ready: boolean; locale: Locale }) {
  const label = ready
    ? locale === 'en'
      ? 'Ready'
      : 'Listo'
    : locale === 'en'
      ? 'Missing'
      : 'Falta';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium',
        ready ? 'bg-brand-soft text-brand-text' : 'bg-surface-200 text-ink-muted',
      )}
    >
      <svg aria-hidden viewBox="0 0 16 16" width="13" height="13" fill="none">
        {ready ? (
          <path
            d="m3.5 8.5 3 3 6-7"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        ) : (
          <circle
            cx="8"
            cy="8"
            r="5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeDasharray="2.6 2.2"
          />
        )}
      </svg>
      {label}
    </span>
  );
}

/**
 * The hero's one live thing: pick a stage and the sample company file shows
 * what is usually asked for at that stage. A real, cropped fragment of the
 * product (`data-ui`), clearly labelled as a sample. Without JavaScript it
 * renders the first stage and stays readable.
 */
export function DossierExplorer({ locale }: { locale: Locale }) {
  const t = content[locale].dossier;
  const [stageId, setStageId] = useState<StageId>('preseed');
  const stage = t.stages.find((s) => s.id === stageId) ?? t.stages[0]!;
  const ready = stage.items.filter((i) => i.ready).length;
  const groupId = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // Radio-group keyboard model: arrows move and select, focus follows.
  function onKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + t.stages.length) % t.stages.length;
    setStageId(t.stages[next]!.id);
    tabs.current[next]?.focus();
  }

  return (
    <figure
      data-ui
      aria-label={t.aria}
      className="relative w-full max-w-[500px] overflow-hidden rounded-card-lg border border-line bg-surface-100 text-ink"
    >
      <div
        role="radiogroup"
        aria-label={t.stageAria}
        id={groupId}
        className="flex gap-1 overflow-x-auto border-b border-line bg-surface-200/60 p-1.5"
      >
        {t.stages.map((s, i) => {
          const selected = s.id === stageId;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setStageId(s.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                'min-h-10 shrink-0 rounded-lg px-3.5 text-[14px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none',
                selected
                  ? 'bg-surface-100 text-ink shadow-[0_1px_2px_rgba(2,6,23,0.25)]'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{stage.company}</p>
          <p className="text-[13px] text-ink-muted">
            {t.file} · {stage.label}
          </p>
        </div>
        <span className="data-label rounded-md border border-line px-2 py-0.5 text-sm font-medium uppercase tracking-[0.1em] text-ink-muted">
          {t.sample}
        </span>
      </div>

      {/* Progress: the only bar on the page, and it adds up. */}
      <div className="px-5">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200"
          role="img"
          aria-label={t.count(ready, stage.items.length)}
        >
          <div
            className="h-full rounded-full bg-brand-fill transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${(ready / stage.items.length) * 100}%` }}
          />
        </div>
      </div>

      <ul key={stage.id} className="mt-3 divide-y divide-line" aria-live="polite">
        {stage.items.map((item, i) => (
          <li
            key={item.name}
            style={{ animationDelay: `${i * 45}ms` }}
            className="flex animate-fade-up items-center justify-between gap-4 px-5 py-3 motion-reduce:animate-none"
          >
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{item.name}</p>
              <p className="truncate text-[13px] text-ink-muted">{item.detail}</p>
            </div>
            <StatusMark ready={item.ready} locale={locale} />
          </li>
        ))}
      </ul>

      <figcaption className="flex items-center justify-between gap-4 border-t border-line bg-surface-200/40 px-5 py-3 text-[13px] text-ink-muted">
        <span className="font-medium text-ink">{t.count(ready, stage.items.length)}</span>
        <span className="inline-flex items-center gap-1.5">
          <svg aria-hidden viewBox="0 0 16 16" width="13" height="13" fill="none">
            <rect
              x="3.5"
              y="7"
              width="9"
              height="6"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {t.sharedWith}
        </span>
      </figcaption>
    </figure>
  );
}
