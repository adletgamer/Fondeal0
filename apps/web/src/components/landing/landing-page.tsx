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
    title: 'Fondealo — Presenta tu empresa. Respalda su historia.',
    description:
      'Estamos creando un pasaporte para reunir los datos de tu empresa y compartirlos con quienes tú elijas. Únete a la lista de espera.',
    path: '/',
    og: 'es_PE',
  },
  en: {
    title: 'Fondealo — Present your company. Back up its story.',
    description:
      'We’re building a passport to bring your company’s data together and share it with the people you choose. Join the waitlist.',
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
