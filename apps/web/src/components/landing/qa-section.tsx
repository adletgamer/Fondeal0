'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { buttonVariants, cn } from '@fondealo/ui';
import { TopicAbout, TopicData, TopicMype, TopicStartup } from './art';
import { content, type Locale } from './content';
import { frame, type } from './type';

const TOPIC_ICON = { startup: TopicStartup, mype: TopicMype, data: TopicData, about: TopicAbout };

/**
 * Questions and answers grouped by topic: an ARIA tablist (arrow keys move
 * between topics) over an accordion where one answer opens at a time, plus
 * a side card that sends the remaining questions to the waitlist. Without
 * JavaScript the first topic is shown and every answer still opens.
 */
export function QaSection({ locale }: { locale: Locale }) {
  const t = content[locale].qa;
  const [topic, setTopic] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const current = t.topics[topic]!;

  function onKey(e: KeyboardEvent, i: number) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + t.topics.length) % t.topics.length;
    setTopic(next);
    tabs.current[next]?.focus();
  }

  return (
    <section id="preguntas" aria-labelledby="qa-title" className="bg-surface-100">
      <div className={cn(frame, 'py-12 sm:py-16')}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 id="qa-title" data-reveal className={cn(type.h2, 'text-ink')}>
              {t.heading}
            </h2>
            <p data-reveal className={cn(type.lead, 'mt-3 text-ink-muted')}>
              {t.sub}
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label={t.tabsAria}
          data-reveal
          className="mt-6 flex gap-2 overflow-x-auto pb-1"
        >
          {t.topics.map((tp, i) => {
            const Icon = TOPIC_ICON[tp.id];
            const selected = i === topic;
            return (
              <button
                key={tp.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                id={`${baseId}-tab-${i}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTopic(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  'inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-base font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none',
                  selected
                    ? 'border-brand-fill bg-brand-fill text-on-brand'
                    : 'border-line bg-surface-100 text-ink hover:border-line-strong',
                )}
              >
                <Icon size={20} className={selected ? 'text-on-brand' : 'text-brand-text'} />
                {tp.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[8fr_4fr]">
          <div
            id={`${baseId}-panel`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${topic}`}
            className="space-y-3"
          >
            {current.items.map((item, i) => (
              <details
                key={`${current.id}-${item.q}`}
                name={`${baseId}-qa`}
                open={i === 0}
                className="group animate-fade-up rounded-card-lg border border-line bg-surface-0 transition-colors open:border-brand-line motion-reduce:animate-none"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-card-lg px-5 py-4 text-base font-medium leading-snug text-ink sm:text-lg [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-200 text-ink transition-colors group-open:bg-brand-fill group-open:text-on-brand"
                  >
                    <span className="relative h-3.5 w-3.5">
                      <span className="absolute left-0 top-1/2 h-0.5 w-3.5 -translate-y-1/2 rounded bg-current" />
                      <span className="absolute left-1/2 top-0 h-3.5 w-0.5 -translate-x-1/2 rounded bg-current transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" />
                    </span>
                  </span>
                </summary>
                <p className={cn(type.body, 'max-w-[60ch] px-6 pb-6 text-ink-muted')}>{item.a}</p>
              </details>
            ))}
          </div>

          <aside
            data-reveal
            className="flex flex-col justify-between gap-6 self-start rounded-3xl bg-ink p-7 text-surface-0"
          >
            <div>
              <TopicAbout size={32} className="text-brand-fill" />
              <h3 className={cn(type.lead, 'mt-4 font-display font-semibold')}>{t.askTitle}</h3>
              <p className={cn(type.body, 'mt-2 text-surface-0/80')}>{t.askText}</p>
            </div>
            <a href="#lista" className={cn(buttonVariants({ size: 'lg' }), 'self-start')}>
              {t.askCta}
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
