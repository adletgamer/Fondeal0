import type { CSSProperties } from 'react';
import Link from 'next/link';
import { buttonVariants, cn } from '@fondealo/ui';
import { BrandBadge3D } from '@/components/brand/icon-3d';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { AccessNetwork } from './access-network';
import { content, type Locale } from './content';
import { MobileNav } from './mobile-nav';
import { PassportScene } from './passport-scene';
import { SignalLedger, SignalRules } from './signal-ledger';
import { frame, type } from './type';
import { WaitlistForm } from './waitlist-form';

/** Stagger index for `[data-reveal]` entrances (see globals.css). */
const stagger = (i: number) => ({ '--i': i }) as CSSProperties;

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
            className="hidden h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-200 hover:text-ink sm:inline-flex"
          >
            {t.header.switchLabel}
          </a>
          <span className="hidden sm:block">
            <ThemeToggle locale={locale} />
          </span>
          <Link
            href="/onboarding"
            className="hidden h-11 items-center px-2 text-sm font-medium text-ink-muted hover:text-ink md:inline-flex"
          >
            {t.header.haveAccount}
          </Link>
          <a href="#lista" className={cn(buttonVariants({ size: 'md' }), 'ml-1 px-3.5 sm:px-5')}>
            {t.header.join}
          </a>
          <MobileNav
            nav={t.nav}
            navAria={t.header.navAria}
            open={t.header.menu}
            close={t.header.menuClose}
            haveAccount={t.header.haveAccount}
            lang={{
              href: t.header.switchHref,
              label: t.header.switchLabel,
              code: t.header.switchLang,
              aria: t.header.switchAria,
            }}
          />
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
          'grid items-center gap-6 pb-12 pt-8 sm:pt-12 lg:min-h-[calc(100svh-72px)] lg:grid-cols-[1.02fr_1fr] lg:gap-8 lg:py-12',
        )}
      >
        <div className="min-w-0">
          <p className={cn(type.meta, 'landing-fade mb-5 font-medium text-brand-text')}>
            {t.eyebrow}
          </p>
          <h1 id="hero-title" className={cn(type.display, 'text-balance text-ink')}>
            {t.lines.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <span className="landing-rise block" style={stagger(i)}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className={cn(type.lead, 'landing-fade mt-6 max-w-[34rem] text-ink-muted')}>
            {t.lead}
          </p>
          <div className="landing-fade mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
            <a href="#lista" className={buttonVariants({ size: 'xl' })}>
              {t.cta}
              <svg aria-hidden viewBox="0 0 16 16" width="18" height="18" fill="none">
                <path
                  d="M3 8h10m-4-4 4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a
              href="#senales"
              className={cn(buttonVariants({ variant: 'link', size: 'lg' }), 'px-0')}
            >
              {t.secondary}
            </a>
          </div>
          <p className={cn(type.meta, 'landing-fade mt-6 max-w-[34rem] text-ink-muted')}>
            {t.disclaimer}
          </p>
        </div>

        <div className="landing-fade order-first min-w-0 lg:order-none" style={stagger(3)}>
          <PassportScene
            label={t.sceneLabel}
            layerLabels={t.layers}
            pauseLabel={t.pause}
            playLabel={t.play}
            className="mx-auto aspect-[3/2] max-w-[620px] sm:aspect-[5/4]"
          />
        </div>
      </div>
    </section>
  );
}

export function Signals({ locale }: { locale: Locale }) {
  const t = content[locale].signals;
  return (
    <section id="senales" aria-labelledby="signals-title" className="bg-surface-100">
      <div
        className={cn(
          frame,
          'grid grid-cols-[minmax(0,1fr)] items-center gap-16 py-20 sm:py-28 lg:grid-cols-[5fr_6fr] lg:gap-20',
        )}
      >
        <div className="min-w-0">
          <h2 id="signals-title" data-reveal className={cn(type.h2, 'text-balance text-ink')}>
            {t.heading}
          </h2>
          <p data-reveal className={cn(type.lead, 'mt-5 max-w-[34rem] text-ink-muted')}>
            {t.lead}
          </p>
          <div data-reveal>
            <SignalRules locale={locale} />
          </div>
        </div>
        <div data-reveal className="flex min-w-0 justify-center lg:justify-end">
          <SignalLedger locale={locale} />
        </div>
      </div>
    </section>
  );
}

export function Access({ locale }: { locale: Locale }) {
  const t = content[locale].access;
  return (
    <section id="red" aria-labelledby="access-title" className="bg-surface-0">
      <div className={cn(frame, 'py-20 sm:py-28')}>
        <div className="max-w-2xl">
          <p className={cn(type.meta, 'mb-3 font-medium text-brand-text')}>{t.network}</p>
          <h2 id="access-title" data-reveal className={cn(type.h2, 'text-balance text-ink')}>
            {t.heading}
          </h2>
          <p data-reveal className={cn(type.lead, 'mt-5 text-ink-muted')}>
            {t.lead}
          </p>
        </div>
        <div data-reveal className="mt-12">
          <AccessNetwork locale={locale} />
        </div>
        <p className={cn(type.meta, 'mt-5 text-ink-muted')}>
          {t.hint} {t.partners}
        </p>
      </div>
    </section>
  );
}

export function Trust({ locale }: { locale: Locale }) {
  const t = content[locale].trust;
  return (
    <section id="estado" aria-labelledby="trust-title" className="bg-surface-100">
      <div className={cn(frame, 'grid gap-12 py-20 sm:py-28 lg:grid-cols-[5fr_7fr] lg:gap-20')}>
        <div>
          <h2 id="trust-title" data-reveal className={cn(type.h2, 'text-ink')}>
            {t.heading}
          </h2>
          <p
            data-reveal
            className={cn(
              type.meta,
              'mt-5 inline-flex items-center gap-2 rounded-full bg-surface-200 px-3.5 py-1.5 font-medium text-ink',
            )}
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-orbit" />
            {t.stellar}
          </p>
          <p data-reveal className={cn(type.body, 'mt-5 max-w-sm text-ink-muted')}>
            {t.privacy}
          </p>
        </div>
        <div className="grid gap-10 sm:grid-cols-2">
          <div data-reveal>
            <h3 className="text-sm font-semibold text-ink-muted">{t.todayTitle}</h3>
            <dl className="mt-4 space-y-4">
              {t.today.map((r) => (
                <div key={r.part} className="flex flex-col gap-1">
                  <dt className={cn(type.body, 'font-medium text-ink')}>{r.part}</dt>
                  <dd className="inline-flex items-center gap-2 text-sm text-ink-muted">
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
          <div data-reveal style={stagger(1)}>
            <h3 className="text-sm font-semibold text-ink-muted">{t.notTitle}</h3>
            <ul className="mt-4 space-y-3">
              {t.notItems.map((item) => (
                <li key={item} className={cn(type.body, 'flex items-start gap-3 text-ink')}>
                  <CrossIcon className="mt-1 shrink-0 text-ink-muted" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq({ locale }: { locale: Locale }) {
  const t = content[locale].faq;
  return (
    <section id="preguntas" aria-labelledby="faq-title" className="bg-surface-0">
      <div className={cn(frame, 'grid gap-8 py-20 sm:py-28 lg:grid-cols-[4fr_8fr] lg:gap-16')}>
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
              className="group rounded-2xl bg-surface-100 transition-colors open:bg-surface-200"
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
    <section id="lista" aria-labelledby="cta-title" className="bg-surface-100">
      <div
        className={cn(
          frame,
          'grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-[1fr_480px] lg:gap-16',
        )}
      >
        <div className="min-w-0">
          <BrandBadge3D size={150} className="mb-6 h-[120px] w-[120px] sm:h-[150px] sm:w-[150px]" />
          <h2
            id="cta-title"
            data-reveal
            className="font-display text-[clamp(2rem,8vw,4.5rem)] font-semibold leading-[1] tracking-[-0.03em] text-ink"
          >
            <span className="block">{t.heading[0]}</span>
            <span className="block">{t.heading[1]}</span>
          </h2>
          <p data-reveal className={cn(type.lead, 'mt-6 max-w-md text-ink-muted')}>
            {t.text}
          </p>
        </div>
        <div data-ui data-reveal className="w-full rounded-3xl bg-surface-200 p-6 text-ink sm:p-8">
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
