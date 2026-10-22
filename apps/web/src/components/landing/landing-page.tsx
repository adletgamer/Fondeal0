import type { Metadata } from 'next';
import { content, type Locale } from './content';
import { RevealMotion } from './reveal-motion';
import {
  Access,
  Faq,
  Hero,
  LandingFooter,
  LandingHeader,
  Signals,
  Trust,
  WaitlistSection,
} from './sections';

const META: Record<Locale, { title: string; description: string; path: string; og: string }> = {
  es: {
    title: 'Fondealo — El pasaporte verificable de tu empresa',
    description:
      'Crea un pasaporte portable de tu empresa con tu identidad, tu actividad y tu reputación financiera, y compártelo solo con quien tú elijas. Acceso anticipado gratuito. Fondealo no presta ni invierte.',
    path: '/',
    og: 'es_PE',
  },
  en: {
    title: 'Fondealo — Your company’s verifiable passport',
    description:
      'Build a portable company passport from your identity, activity and financial reputation, and share it only with the people you choose. Free early access. Fondealo does not lend or invest.',
    path: '/en',
    og: 'en_US',
  },
};

export function landingMetadata(locale: Locale): Metadata {
  const m = META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: m.path, languages: { 'es-PE': '/', en: '/en' } },
    openGraph: { title: m.title, description: m.description, url: m.path, locale: m.og },
    twitter: { card: 'summary_large_image', title: m.title, description: m.description },
  };
}

/**
 * Public landing (docs/brand/identity.md §9).
 * Server-rendered and readable without JavaScript; client islands are the
 * live fragments, the theme switch, the waitlist form and the scroll entrances.
 */
export function LandingPage({ locale }: { locale: Locale }) {
  const t = content[locale];
  return (
    <div lang={t.lang} className="landing min-h-screen bg-surface-0 text-ink">
      <div aria-hidden className="landing-progress" />
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-ink px-4 py-3 text-surface-0 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t.skip}
      </a>
      <LandingHeader locale={locale} />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero locale={locale} />
        <Signals locale={locale} />
        <Access locale={locale} />
        <Trust locale={locale} />
        <Faq locale={locale} />
        <WaitlistSection locale={locale} />
      </main>
      <LandingFooter locale={locale} />
      <RevealMotion />
    </div>
  );
}
