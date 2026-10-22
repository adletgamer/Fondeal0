import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JetBrains_Mono, Onest, Unbounded } from 'next/font/google';
import { PrivyProviders } from '@/components/privy-providers';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import '@fondealo/ui/styles.css';
import './globals.css';

// Identity type (docs/brand/identity.md): Onest for text and app headings,
// Unbounded for the wordmark and marketing display lines only.
const onest = Onest({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

const unbounded = Unbounded({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  variable: '--font-brand',
  display: 'swap',
});

// Ledger type: addresses, hashes, amounts — inside the app only.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const title = 'Fondealo — El pasaporte verificable de tu empresa';
const description =
  'Crea un pasaporte portable de tu empresa con tu identidad, tu actividad y tu reputación financiera, y compártelo solo con quien tú elijas. Acceso anticipado gratuito. Fondealo no presta ni invierte.';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fondealo.xyz'),
  title,
  description,
  keywords: [
    'startups Perú',
    'MYPE',
    'pasaporte de empresa',
    'señales de confianza',
    'financiamiento para empresas',
    'Pasaporte de Empresa',
  ],
  openGraph: {
    title,
    description,
    url: 'https://www.fondealo.xyz',
    siteName: 'Fondealo',
    locale: 'es_PE',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
  icons: {
    icon: [{ url: '/favicon.svg?v=3', type: 'image/svg+xml' }],
    apple: [{ url: '/orbital-badge.png?v=2', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Night is the default theme; the init script swaps in a saved choice
    // before first paint, hence suppressHydrationWarning on <html>.
    <html
      lang="es-PE"
      data-theme="dark"
      suppressHydrationWarning
      className={`${onest.variable} ${unbounded.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-surface-0 font-sans text-ink antialiased">
        <PrivyProviders>{children}</PrivyProviders>
      </body>
    </html>
  );
}
