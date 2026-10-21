'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@fondealo/ui';
import { content, type Locale } from './content';
import { type } from './type';

type Panel = (typeof content)['es']['steps']['panel'];

function Check({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
        on ? 'border-brand-fill bg-brand-fill text-on-brand' : 'border-line-strong',
      )}
    >
      {on ? (
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
          <path
            d="m3.5 8.5 3 3 6-7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

/** One fragment of the product, in the state that matches step `index`. */
export function StepPanel({ panel, index }: { panel: Panel; index: number }) {
  return (
    <div
      data-ui
      className="w-full rounded-2xl border border-line bg-surface-100 p-5 text-ink sm:p-6"
    >
      {index === 0 ? (
        <div className="space-y-3">
          <p className="text-[15px] font-semibold">{panel.formTitle}</p>
          {panel.fields.map(([label, value]) => (
            <div key={label}>
              <p className="text-[13px] text-ink-muted">{label}</p>
              <p className="mt-1 rounded-lg border border-line-strong/60 bg-surface-0 px-3 py-2 text-[14px]">
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : index === 1 ? (
        <div className="space-y-2">
          <p className="mb-3 text-[15px] font-semibold">{panel.pickTitle}</p>
          {panel.picks.map((p) => (
            <div
              key={p.name}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px]',
                p.on ? 'bg-brand-soft' : 'bg-surface-200/60',
              )}
            >
              <Check on={p.on} />
              {p.name}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[15px] font-semibold">{panel.shareTitle}</p>
          <div className="flex items-center gap-3 rounded-lg bg-surface-200/60 p-3">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-full bg-surface-300 text-[14px] font-semibold"
            >
              {panel.shareTo.slice(0, 1)}
            </span>
            <div>
              <p className="text-[14px] font-medium">{panel.shareTo}</p>
              <p className="text-[13px] text-ink-muted">{panel.shareSees}</p>
            </div>
          </div>
          <p className="rounded-lg bg-brand-fill px-4 py-2.5 text-center text-[14px] font-semibold text-on-brand">
            {panel.shareButton}
          </p>
          <p className="text-[13px] text-ink-muted">{panel.revoke}</p>
        </div>
      )}
    </div>
  );
}

/**
 * "How it works": from lg up, the product fragment stays in view while the
 * three statements scroll past and switch its state. Nothing hijacks the
 * scroll; the active step is read with IntersectionObserver. Below lg, with
 * reduced motion or without JavaScript, each statement simply sits above its
 * own panel.
 */
export function StepsShowcase({ locale }: { locale: Locale }) {
  const t = content[locale].steps;
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const items = refs.current.filter(Boolean) as HTMLLIElement[];
    if (!('IntersectionObserver' in window) || !items.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[5fr_7fr] lg:gap-16">
      <ol className="space-y-12 lg:space-y-0">
        {t.items.map((s, i) => (
          <li
            key={s.title}
            data-step={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="lg:flex lg:min-h-[62vh] lg:flex-col lg:justify-center"
          >
            <div className="flex items-baseline gap-4">
              <span
                aria-hidden
                className={cn(
                  'mt-1 h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-300 motion-reduce:transition-none',
                  active === i ? 'bg-brand-fill' : 'bg-line-strong',
                )}
              />
              <div>
                <p
                  className={cn(
                    type.lead,
                    'font-display font-semibold transition-colors duration-300 motion-reduce:transition-none',
                    active === i ? 'text-ink' : 'text-ink lg:text-ink-muted',
                  )}
                  aria-current={active === i ? 'step' : undefined}
                >
                  {s.title}
                </p>
                <p className={cn(type.body, 'mt-2 max-w-md text-ink-muted')}>{s.text}</p>
              </div>
            </div>
            {/* Below lg each step shows its own panel. */}
            <div className="mt-6 lg:hidden">
              <StepPanel panel={t.panel} index={i} />
            </div>
          </li>
        ))}
      </ol>
      <div className="hidden lg:block">
        <div className="sticky top-[18vh]">
          <div className="relative">
            {t.items.map((s, i) => (
              <div
                key={s.title}
                aria-hidden={active !== i}
                className={cn(
                  'transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
                  i === 0 ? 'relative' : 'absolute inset-x-0 top-0',
                  active === i
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-3 opacity-0',
                )}
              >
                <StepPanel panel={t.panel} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
