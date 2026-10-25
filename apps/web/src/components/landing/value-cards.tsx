import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@fondealo/ui';
import { PictoAudience, PictoFile, PictoNotLoan, PictoTestMode } from './art';
import { content, type IntroIcon, type Locale } from './content';
import { frame, type } from './type';

const ICONS: Record<IntroIcon, (p: { className?: string; size?: number }) => ReactNode> = {
  audience: PictoAudience,
  file: PictoFile,
  notLoan: PictoNotLoan,
  test: PictoTestMode,
};

/** Renders `**phrase**` as a bold run in full ink; everything else stays muted. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * The intro as four illustrated cards in a rising stair from lg up, each
 * with its own pictogram (Brickken-style cards, Fondealo's content). On
 * smaller screens they form a regular grid.
 */
export function ValueCards({ locale }: { locale: Locale }) {
  const t = content[locale].intro;
  // Stair offsets on large screens: the first card sits lowest.
  const offsets = [
    'lg:translate-y-24',
    'lg:translate-y-16',
    'lg:translate-y-8',
    'lg:translate-y-0',
  ];
  return (
    <section
      id="startups"
      aria-labelledby="intro-title"
      className="relative overflow-hidden bg-editorial"
    >
      <div aria-hidden className="landing-dots absolute inset-0 opacity-40" />
      <div className={cn(frame, 'relative py-16 sm:py-28')}>
        <div className="max-w-3xl">
          <h2 id="intro-title" data-reveal className={cn(type.h2, 'text-ink')}>
            {t.heading}
          </h2>
          <p data-reveal className={cn(type.lead, 'mt-4 text-ink-muted')}>
            {t.sub}
          </p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:items-start lg:pb-24">
          {t.cards.map((c, i) => {
            const Icon = ICONS[c.icon];
            return (
              <li
                key={c.title}
                data-reveal
                style={{ '--i': i } as CSSProperties}
                className={cn(
                  'group rounded-card-lg border border-line bg-surface-0 p-6 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-brand-line motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-7',
                  offsets[i],
                )}
              >
                <div className="flex justify-end">
                  <Icon
                    size={64}
                    className="text-brand-text transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                  />
                </div>
                <h3 className={cn(type.lead, 'mt-6 font-display font-semibold text-brand-text')}>
                  {c.title}
                </h3>
                <p className={cn(type.body, 'mt-3 text-ink-muted')}>
                  <RichText text={c.text} />
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
