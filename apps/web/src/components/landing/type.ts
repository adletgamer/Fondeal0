/**
 * The landing's whole type system: five steps, no more
 * (docs/strategy/2026-10-20-landing-refactor-plan.md §3). Every visible size
 * on the page maps to one of these; interface fragments (`data-ui`) use their
 * own true sizes inside.
 */
export const type = {
  // Two authored lines that may wrap inside the column: full width below lg,
  // just over half the grid from lg up.
  display:
    'font-display text-[clamp(2rem,8.6vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.03em] lg:text-[clamp(2.75rem,4.1vw,3.9rem)]',
  h2: 'font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]',
  lead: 'text-xl leading-snug sm:text-[22px]',
  body: 'text-base leading-relaxed sm:text-[17px]',
  meta: 'text-sm leading-normal',
} as const;

/** One pair of page margins for every section. */
export const frame = 'mx-auto w-full max-w-6xl px-5 sm:px-8';
