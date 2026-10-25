/**
 * The landing's whole type system: five steps, no more
 * (docs/strategy/2026-10-21-landing-redesign-plan.md §3). Every visible size
 * on the page maps to one of these; interface fragments (`data-ui`) use their
 * own true sizes inside.
 */
export const type = {
  // Scales with the viewport so each authored line stays one line: full width
  // below lg, half the grid from lg up.
  display:
    'font-display text-[clamp(1.75rem,9vw,5rem)] font-semibold leading-[1.02] tracking-[-0.03em] lg:text-[clamp(3rem,4.4vw,4.25rem)]',
  h2: 'font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]',
  lead: 'text-xl leading-snug sm:text-[22px]',
  body: 'text-base leading-relaxed sm:text-[17px]',
  meta: 'text-sm leading-normal',
  eyebrow: 'data-label text-sm font-medium uppercase tracking-[0.14em]',
} as const;

/** One pair of page margins for every section. */
export const frame = 'mx-auto w-full max-w-7xl px-5 sm:px-8';
