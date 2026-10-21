import type { Metadata } from 'next';
import { content, type Locale } from './content';
import { RevealMotion } from './reveal-motion';
import {
  Faq,
  Hero,
  Includes,
  Intro,
  LandingFooter,
  LandingHeader,
  NotDo,
  Privacy,
  Steps,
  Today,
  WaitlistSection,
} from './sections';

const META: Record<Locale, { title: string; description: string; path: string; og: string }> = {
  es: {
    title: 'Fondealo — El expediente de tu startup o MYPE, listo para compartir',
    description:
      'Prepara una vez el expediente de tu startup o MYPE y decide con quién compartirlo. Acceso anticipado gratuito. Fondealo no presta ni invierte.',
    path: '/',
    og: 'es_PE',
  },
  en: {
    title: 'Fondealo — Your startup’s company file, ready to share',
    description:
      'Organise your startup or small business file once and choose who sees it. Free early access. Fondealo does not lend or invest.',
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
 * Public landing (docs/strategy/2026-10-21-landing-redesign-plan.md).
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
        <Intro locale={locale} />
        <Steps locale={locale} />
        <Includes locale={locale} />
        <Privacy locale={locale} />
        <NotDo locale={locale} />
        <Today locale={locale} />
        <Faq locale={locale} />
        <WaitlistSection locale={locale} />
      </main>
      <LandingFooter locale={locale} />
      <RevealMotion />
    </div>
  );
}
