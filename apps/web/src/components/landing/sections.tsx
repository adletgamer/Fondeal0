import type { CSSProperties } from 'react';
import Link from 'next/link';
import { buttonVariants, cn } from '@fondealo/ui';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { content, type Locale } from './content';
import { DossierExplorer } from './dossier-explorer';
import { IncludesExplorer } from './includes-explorer';
import { StepsShowcase } from './steps-showcase';
import { frame, type } from './type';
import { WaitlistForm } from './waitlist-form';

/** Stagger index for `[data-reveal]` entrances (see globals.css). */
const stagger = (i: number) => ({ '--i': i }) as CSSProperties;

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="18" height="18" fill="none" className={className}>
      <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="18" height="18" fill="none" className={className}>
      <path
        d="m4.5 4.5 7 7m0-7-7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LandingHeader({ locale }: { locale: Locale }) {
  const t = content[locale];
  const home = locale === 'en' ? '/en' : '/';
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface-0">
      <div className={cn(frame, 'flex h-16 items-center justify-between gap-3 sm:h-[72px]')}>
        <Link href={home} aria-label={t.header.home} className="rounded-lg text-ink">
          <Logo priority />
        </Link>
        <nav aria-label={t.header.navAria} className="hidden items-center gap-7 lg:flex">
          {t.nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href={t.header.switchHref}
            hrefLang={t.header.switchLang}
            lang={t.header.switchLang}
            aria-label={t.header.switchAria}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-200 hover:text-ink"
          >
            {t.header.switchLabel}
          </a>
          <ThemeToggle />
          <Link
            href="/onboarding"
            className="hidden h-11 items-center px-2 text-sm font-medium text-ink-muted hover:text-ink md:inline-flex"
          >
            {t.header.haveAccount}
          </Link>
          <a href="#lista" className={cn(buttonVariants({ size: 'md' }), 'ml-1')}>
            {t.header.join}
          </a>
        </div>
      </div>
    </header>
  );
}

export function Hero({ locale }: { locale: Locale }) {
  const t = content[locale].hero;
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden bg-surface-0">
      <div
        className={cn(
          frame,
          'grid items-center gap-12 pb-20 pt-10 sm:pt-16 lg:min-h-[calc(100svh-72px)] lg:grid-cols-[1fr_1fr] lg:gap-14 lg:py-16',
        )}
      >
        <div className="min-w-0">
          <h1 id="hero-title" className={cn(type.display, 'text-ink')}>
            {t.lines.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span className="landing-rise block" style={stagger(i)}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className={cn(type.lead, 'landing-fade mt-6 max-w-[34rem] text-ink-muted')}>
            {t.lead}
          </p>
          <div className="landing-fade mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#lista" className={buttonVariants({ size: 'xl' })}>
              {t.cta}
            </a>
            <a href="#como-funciona" className={buttonVariants({ variant: 'link', size: 'lg' })}>
              {t.secondary}
            </a>
          </div>
          <p className={cn(type.meta, 'landing-fade mt-6 max-w-[34rem] text-ink-muted')}>
            {t.disclaimer}
          </p>
        </div>
        {/* One flat stage colour behind the fragment: depth from tone, not glow. */}
        <div className="relative flex min-w-0 justify-center lg:justify-end">
          <div
            aria-hidden
            className="absolute -inset-x-6 -bottom-8 top-10 rounded-[28px] bg-surface-200 sm:-inset-x-10 lg:-right-16 lg:left-10"
          />
          <div className="landing-fade relative w-full max-w-[500px]" style={stagger(3)}>
            <DossierExplorer locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Intro({ locale }: { locale: Locale }) {
  const t = content[locale].intro;
  return (
    <section aria-labelledby="intro-title" className="bg-surface-100">
      <div className={cn(frame, 'py-16 sm:py-28')}>
        <h2 id="intro-title" className="sr-only">
          {t.srHeading}
        </h2>
        <p
          data-reveal
          className="max-w-4xl font-display text-[clamp(1.25rem,2.6vw,2.25rem)] font-medium leading-[1.25] tracking-[-0.01em] text-ink"
        >
          {t.lead}
        </p>
        <div className="mt-12 grid gap-x-10 gap-y-8 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {t.columns.map((c, i) => (
            <p
              key={c.runIn}
              data-reveal
              style={stagger(i)}
              className={cn(type.body, 'border-t-2 border-brand-fill pt-4 text-ink-muted')}
            >
              <strong className="font-semibold text-ink">{c.runIn}</strong> {c.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Steps({ locale }: { locale: Locale }) {
  const t = content[locale].steps;
  return (
    <section id="como-funciona" aria-labelledby="steps-title" className="bg-surface-0">
      <div className={cn(frame, 'py-16 sm:py-28')}>
        <h2 id="steps-title" data-reveal className={cn(type.h2, 'text-ink')}>
          {t.heading}
        </h2>
        <StepsShowcase locale={locale} />
      </div>
    </section>
  );
}

export function Includes({ locale }: { locale: Locale }) {
  const t = content[locale].includes;
  return (
    <section id="que-incluye" aria-labelledby="includes-title" className="bg-surface-100">
      <div className={cn(frame, 'grid gap-8 py-16 sm:py-28 lg:grid-cols-[4fr_8fr] lg:gap-16')}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="includes-title" data-reveal className={cn(type.h2, 'text-ink')}>
            {t.heading}
          </h2>
          <p data-reveal className={cn(type.body, 'mt-4 max-w-sm text-ink-muted')}>
            {t.note}
          </p>
        </div>
        <div data-reveal>
          <IncludesExplorer locale={locale} />
        </div>
      </div>
    </section>
  );
}

export function Privacy({ locale }: { locale: Locale }) {
  const t = content[locale].privacy;
  return (
    <section id="tus-datos" aria-labelledby="privacy-title" className="bg-surface-0">
      <div
        className={cn(
          frame,
          'grid items-center gap-12 py-16 sm:py-28 lg:grid-cols-[6fr_6fr] lg:gap-20',
        )}
      >
        <div className="order-2 lg:order-1" data-reveal>
          <div data-ui className="rounded-2xl border border-line bg-surface-100 p-2 text-ink">
            <p className="px-4 pb-2 pt-3 text-[15px] font-semibold">{t.panel.title}</p>
            <ul className="space-y-1">
              {t.panel.rows.map((r) => (
                <li
                  key={r.who}
                  className={cn(
                    'flex items-center gap-4 rounded-xl px-4 py-3.5',
                    r.active ? 'bg-surface-200/70' : '',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-semibold',
                      r.active ? 'bg-brand-soft text-brand-text' : 'bg-surface-200 text-ink-muted',
                    )}
                  >
                    {r.who.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-[15px] font-medium',
                        !r.active && 'text-ink-muted line-through',
                      )}
                    >
                      {r.who}
                    </p>
                    <p className="text-[13px] text-ink-muted">
                      {r.sees} · {r.when}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-[13px] font-medium',
                      r.active ? 'bg-brand-soft text-brand-text' : 'bg-surface-200 text-ink-muted',
                    )}
                  >
                    {r.active ? t.panel.active : t.panel.revoked}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <h2 id="privacy-title" data-reveal className={cn(type.h2, 'text-ink')}>
            {t.heading}
          </h2>
          <p data-reveal className={cn(type.lead, 'mt-4 text-ink')}>
            {t.statement}
          </p>
          <ul className="mt-8 space-y-4">
            {t.points.map((p, i) => (
              <li
                key={p}
                data-reveal
                style={stagger(i)}
                className={cn(type.body, 'flex gap-3 text-ink-muted')}
              >
                <CheckIcon className="mt-1 shrink-0 text-brand-text" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function NotDo({ locale }: { locale: Locale }) {
  const t = content[locale].notDo;
  return (
    <section aria-labelledby="notdo-title" className="bg-ink text-surface-0">
      <div className={cn(frame, 'py-16 sm:py-28')}>
        <div className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <h2 id="notdo-title" data-reveal className={type.h2}>
            {t.heading}
          </h2>
          <p data-reveal className={cn(type.lead, 'text-surface-0/80')}>
            {t.statement}
          </p>
        </div>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {t.items.map((item, i) => (
            <li
              key={item}
              data-reveal
              style={stagger(i)}
              className="flex items-start gap-3 rounded-2xl bg-surface-0/[0.06] p-5 text-base font-medium leading-snug"
            >
              <CrossIcon className="mt-0.5 shrink-0 text-surface-0/60" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Today({ locale }: { locale: Locale }) {
  const t = content[locale].today;
  return (
    <section aria-labelledby="today-title" className="bg-surface-0">
      <div className={cn(frame, 'py-16 sm:py-28')}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="today-title" data-reveal className={cn(type.h2, 'text-ink')}>
            {t.heading}
          </h2>
          <p data-reveal className={cn(type.meta, 'text-ink-muted')}>
            {t.note}
          </p>
        </div>
        <dl className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.rows.map((r, i) => (
            <div
              key={r.part}
              data-reveal
              style={stagger(i)}
              className="flex min-h-36 flex-col justify-between gap-6 rounded-2xl border border-line bg-surface-100 p-5"
            >
              <dt className={cn(type.body, 'font-medium text-ink')}>{r.part}</dt>
              <dd className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted">
                <span
                  aria-hidden
                  className={cn(
                    'h-2 w-2 rounded-full',
                    r.live ? 'bg-brand-fill' : 'bg-line-strong',
                  )}
                />
                {r.state}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Faq({ locale }: { locale: Locale }) {
  const t = content[locale].faq;
  return (
    <section id="preguntas" aria-labelledby="faq-title" className="bg-surface-100">
      <div className={cn(frame, 'grid gap-8 py-16 sm:py-28 lg:grid-cols-[4fr_8fr] lg:gap-16')}>
        <h2
          id="faq-title"
          data-reveal
          className={cn(type.h2, 'text-ink lg:sticky lg:top-28 lg:self-start')}
        >
          {t.heading}
        </h2>
        <div className="space-y-2">
          {t.items.map((item, i) => (
            <details
              key={item.q}
              name="faq"
              data-reveal
              style={stagger(i)}
              className="group rounded-2xl bg-surface-200/70 transition-colors open:bg-brand-soft"
            >
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-xl font-medium leading-snug text-ink sm:text-[22px] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden className="relative h-4 w-4 shrink-0">
                  <span className="absolute left-0 top-1/2 h-[2.5px] w-4 -translate-y-1/2 rounded bg-current" />
                  <span className="absolute left-1/2 top-0 h-4 w-[2.5px] -translate-x-1/2 rounded bg-current transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" />
                </span>
              </summary>
              <p className={cn(type.body, 'max-w-[52ch] px-5 pb-5 text-ink')}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WaitlistSection({ locale }: { locale: Locale }) {
  const t = content[locale].cta;
  return (
    <section id="lista" aria-labelledby="cta-title" className="bg-brand-fill text-on-brand">
      <div
        className={cn(
          frame,
          'grid items-center gap-10 py-16 sm:py-28 lg:min-h-[85svh] lg:grid-cols-[1fr_480px] lg:gap-16',
        )}
      >
        <div className="min-w-0 lg:self-end lg:pb-8">
          <h2
            id="cta-title"
            data-reveal
            className="font-display text-[clamp(1.75rem,9vw,5rem)] font-semibold leading-[0.98] tracking-[-0.03em] lg:text-[clamp(3rem,5vw,4.5rem)]"
          >
            <span className="block">{t.heading[0]}</span>
            <span className="block">{t.heading[1]}</span>
          </h2>
          <p data-reveal className={cn(type.lead, 'mt-6 max-w-md')}>
            {t.text}
          </p>
        </div>
        {/* The product's own dialog at true size; its shadow is the one thing that floats. */}
        <div
          data-ui
          data-reveal
          className="w-full rounded-2xl bg-surface-100 p-6 text-ink shadow-[0_30px_80px_-30px_rgba(2,6,23,0.6)] sm:p-8"
        >
          <WaitlistForm locale={locale} />
        </div>
      </div>
    </section>
  );
}

export function LandingFooter({ locale }: { locale: Locale }) {
  const t = content[locale].footer;
  return (
    <footer className="bg-surface-0">
      <div
        className={cn(
          frame,
          'grid gap-3 pb-8 pt-24 text-sm text-ink-muted sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-6',
        )}
      >
        <p>{t.what}</p>
        <nav aria-label={t.aria} className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/onboarding" className="font-medium text-ink hover:underline">
            {t.haveAccount}
          </Link>
          <a
            href="https://github.com/adletgamer/Fondeal0"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-ink hover:underline"
          >
            {t.code}
            <span className="sr-only">{t.codeSr}</span>
          </a>
        </nav>
        <p className="sm:text-right">{t.rights}</p>
      </div>
    </footer>
  );
}
