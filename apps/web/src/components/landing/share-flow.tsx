'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@fondealo/ui';
import {
  PictoAccelerator,
  PictoChoose,
  PictoFund,
  PictoLender,
  PictoRegister,
  PictoShare,
} from './art';
import { content, type Locale } from './content';
import { type } from './type';

const STEP_MS = 5200;
const STEP_ICONS = [PictoRegister, PictoChoose, PictoShare];
const RECIPIENT_ICON = { fund: PictoFund, accelerator: PictoAccelerator, lender: PictoLender };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** Connector paths in a 0–100 box: [wide layout, narrow layout]. */
const PATHS = {
  wide: [
    'M40 50 C 55 50, 55 18, 66 18',
    'M40 50 C 55 50, 58 50, 66 50',
    'M40 50 C 55 50, 55 82, 66 82',
  ],
  narrow: [
    'M50 46 C 50 62, 17 60, 17 74',
    'M50 46 C 50 60, 50 62, 50 74',
    'M50 46 C 50 62, 83 60, 83 74',
  ],
};

/**
 * "How it works" as a living diagram: the company file is a 3D stack of
 * layers; step 1 assembles it, step 2 marks what is shared, step 3 draws the
 * permission lines to who may see it. Auto-advances only while on screen,
 * with a pause control (WCAG 2.2.2); static under reduced motion. Every
 * state is also described in text for assistive tech.
 */
export function ShareFlow({ locale }: { locale: Locale }) {
  const t = content[locale].steps;
  const f = t.flow;
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const auto = playing && inView && !reduced;
  useEffect(() => {
    if (!auto) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % 3), STEP_MS);
    return () => window.clearTimeout(id);
  }, [auto, step]);

  const layersShown = step === 0 ? 1 : 3;

  return (
    <div ref={root} className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[5fr_7fr] lg:gap-14">
      {/* Steps: real buttons, each with a progress bar while it plays. */}
      <div className="flex flex-col gap-3">
        <ol className="flex flex-col gap-3">
          {t.items.map((s, i) => {
            const Icon = STEP_ICONS[i]!;
            const active = step === i;
            return (
              <li key={s.title}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setStep(i);
                    setPlaying(false);
                  }}
                  className={cn(
                    'group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none',
                    active
                      ? 'border-brand-line bg-surface-100'
                      : 'border-transparent bg-surface-100/60 hover:border-line hover:bg-surface-100',
                  )}
                >
                  <span className="flex items-start gap-4">
                    <Icon
                      size={48}
                      className={cn('shrink-0', active ? 'text-brand-text' : 'text-ink-muted')}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-brand-text">
                        {t.stepLabel(i + 1)}
                      </span>
                      <span
                        className={cn(
                          type.lead,
                          'mt-0.5 block font-display font-semibold text-ink',
                        )}
                      >
                        {s.title}
                      </span>
                      <span
                        className={cn(
                          type.body,
                          'mt-1.5 block text-ink-muted',
                          active ? '' : 'lg:sr-only',
                        )}
                      >
                        {s.text}
                      </span>
                    </span>
                  </span>
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-surface-200">
                    <span
                      key={`${step}-${auto}`}
                      className={cn(
                        'block h-full bg-brand-fill',
                        active ? (auto ? 'landing-step-progress' : 'w-full') : 'w-0',
                      )}
                      style={{ animationDuration: `${STEP_MS}ms` }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {!reduced ? (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex h-11 items-center gap-2 self-start rounded-lg px-3 text-sm font-medium text-ink-muted hover:bg-surface-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <svg aria-hidden viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              {playing ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M4 2.5v11l9-5.5z" />}
            </svg>
            {playing ? t.pause : t.play}
          </button>
        ) : null}
      </div>

      {/* The diagram. Decorative for AT; the figcaption carries its meaning. */}
      <figure
        data-ui
        className="relative overflow-hidden rounded-[28px] border border-line bg-surface-100"
      >
        <div aria-hidden className="landing-dots absolute inset-0 opacity-60" />
        <div aria-hidden className="relative aspect-[4/5] w-full sm:aspect-[16/11]">
          {/* Connectors */}
          {(['wide', 'narrow'] as const).map((layout) => (
            <svg
              key={layout}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className={cn(
                'absolute inset-0 h-full w-full',
                layout === 'wide' ? 'hidden sm:block' : 'sm:hidden',
              )}
            >
              {PATHS[layout].map((d, i) => {
                const r = f.recipients[i]!;
                const live = step === 2 && r.access;
                return (
                  <g key={d}>
                    <path
                      d={d}
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                      strokeWidth={live ? 2.5 : 1.5}
                      strokeDasharray={live ? '6 6' : '3 6'}
                      className={cn(
                        'transition-opacity duration-500',
                        live ? 'stroke-brand-fill landing-dash' : 'stroke-line-strong',
                        step === 2 ? 'opacity-100' : 'opacity-30',
                      )}
                    />
                    {live && !reduced ? (
                      <circle r="1.4" className="fill-brand-fill">
                        <animateMotion dur="2.4s" repeatCount="indefinite" path={d} />
                      </circle>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          ))}

          {/* 3D file stack */}
          <div className="absolute left-1/2 top-[8%] -translate-x-1/2 sm:left-[22%] sm:top-1/2 sm:-translate-y-1/2">
            <div className="motion-safe:animate-float" style={{ perspective: '1100px' }}>
              <div
                className="relative h-[120px] w-[170px] sm:h-[150px] sm:w-[210px]"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(56deg) rotateZ(-38deg)',
                }}
              >
                {f.layers.map((label, i) => {
                  const shown = i < layersShown;
                  const shared = step >= 1 && i < 2;
                  return (
                    <div
                      key={label}
                      className={cn(
                        'absolute inset-0 rounded-2xl border-2 p-3 transition-all duration-700 ease-out motion-reduce:transition-none',
                        shared
                          ? 'border-brand-fill bg-brand-soft'
                          : 'border-line-strong/60 bg-surface-100',
                        shown ? 'opacity-100' : 'opacity-0',
                      )}
                      style={{
                        transform: `translateZ(${shown ? i * 34 : 0}px)`,
                        boxShadow: '0 18px 30px -18px rgba(2,6,23,0.45)',
                      }}
                    >
                      <p className="text-[13px] font-semibold text-ink">{label}</p>
                      <p
                        className={cn(
                          'mt-1 text-[13px]',
                          shared ? 'text-brand-text' : 'text-ink-muted',
                        )}
                      >
                        {step === 0 ? f.company : shared ? f.shared : f.notShared}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-6 text-center text-[13px] font-semibold text-ink sm:mt-10">{f.file}</p>
          </div>

          {/* Recipients */}
          <ul className="absolute inset-x-[4%] bottom-[5%] grid grid-cols-3 gap-2 sm:inset-x-auto sm:bottom-auto sm:right-[5%] sm:top-1/2 sm:w-[34%] sm:-translate-y-1/2 sm:grid-cols-1 sm:gap-[7%]">
            {f.recipients.map((r) => {
              const Icon = RECIPIENT_ICON[r.kind];
              const live = step === 2 && r.access;
              const blocked = step === 2 && !r.access;
              return (
                <li
                  key={r.name}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-2xl border bg-surface-100 p-2.5 text-center transition-all duration-500 sm:flex-row sm:gap-3 sm:p-3 sm:text-left',
                    live
                      ? 'border-brand-fill shadow-[0_12px_30px_-16px_rgba(2,6,23,0.5)]'
                      : 'border-line',
                    step < 2 ? 'opacity-60' : 'opacity-100',
                  )}
                >
                  <Icon
                    size={40}
                    className={cn('shrink-0', live ? 'text-brand-text' : 'text-ink-muted')}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-tight text-ink">
                      {r.name}
                    </span>
                    <span
                      className={cn(
                        'mt-1 inline-flex items-center gap-1 text-[13px] font-medium',
                        live ? 'text-brand-text' : 'text-ink-muted',
                      )}
                    >
                      {blocked ? (
                        <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                          <rect
                            x="3.5"
                            y="7"
                            width="9"
                            height="6"
                            rx="1.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      ) : null}
                      {step === 2 ? (r.access ? f.access : f.noAccess) : '·'}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <figcaption className="sr-only" aria-live="polite">
          {f.aria}. {t.stepLabel(step + 1)}: {t.items[step]!.title}. {t.items[step]!.text}
        </figcaption>
      </figure>
    </div>
  );
}
