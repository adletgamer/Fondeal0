'use client';

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@fondealo/ui';
import { content, type Locale } from './content';

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * "What your file will hold" as the product's own search: typing filters the
 * documents, arrows or hover move the selection, and the selected row opens
 * its detail on the accent. Without JavaScript every row is listed with its
 * detail visible.
 */
export function IncludesExplorer({ locale }: { locale: Locale }) {
  const t = content[locale].includes;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const listId = useId();
  const rows = useRef<(HTMLButtonElement | null)[]>([]);

  const items = useMemo(() => {
    const q = fold(query.trim());
    return q ? t.items.filter((i) => fold(`${i.name} ${i.detail}`).includes(q)) : t.items;
  }, [query, t.items]);
  const current = Math.min(selected, Math.max(items.length - 1, 0));

  function move(e: KeyboardEvent, from: number) {
    const delta = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!delta || !items.length) return;
    e.preventDefault();
    const next = Math.min(Math.max(from + delta, 0), items.length - 1);
    setSelected(next);
    rows.current[next]?.focus();
  }

  return (
    <div data-ui className="overflow-hidden rounded-2xl border border-line bg-surface-100 text-ink">
      <label className="flex items-center gap-3 border-b border-line px-5">
        <span className="sr-only">{t.searchLabel}</span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          width="20"
          height="20"
          fill="none"
          className="shrink-0 text-ink-muted"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.7" />
          <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={(e) => move(e, -1)}
          placeholder={t.placeholder}
          aria-controls={listId}
          className="h-16 w-full bg-transparent text-lg text-ink placeholder:text-ink-muted focus:outline-none sm:text-xl"
        />
      </label>
      <ul id={listId} className="p-2">
        {items.length === 0 ? (
          <li className="px-4 py-6 text-base text-ink-muted">{t.empty}</li>
        ) : (
          items.map((item, i) => {
            const isSel = i === current;
            return (
              <li key={item.name}>
                <button
                  ref={(el) => {
                    rows.current[i] = el;
                  }}
                  type="button"
                  aria-expanded={isSel}
                  onClick={() => setSelected(i)}
                  onMouseEnter={() => setSelected(i)}
                  onFocus={() => setSelected(i)}
                  onKeyDown={(e) => move(e, i)}
                  className={cn(
                    'flex w-full items-start justify-between gap-4 rounded-xl px-4 py-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none',
                    isSel ? 'bg-brand-fill text-on-brand' : 'hover:bg-surface-200',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-lg font-semibold leading-snug sm:text-xl">
                      {item.name}
                    </span>
                    <span
                      className={cn(
                        'mt-1 block text-[15px] leading-relaxed',
                        isSel ? 'text-on-brand' : 'sr-only',
                      )}
                    >
                      {item.detail}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold',
                      isSel
                        ? 'bg-on-brand/15 text-on-brand'
                        : item.status === 'today'
                          ? 'bg-brand-soft text-brand-text'
                          : 'bg-surface-200 text-ink-muted',
                    )}
                  >
                    {t.status[item.status]}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
