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

const title = 'Fondealo — Verifica tu empresa una vez y compártela con quien te financia';
const description =
  'Un expediente reutilizable para MYPEs del Perú: registra tu empresa con su RUC, sigue tu verificación y decide qué financiadores pueden ver tu información. Construido sobre Stellar.';

export const metadata: Metadata = {
  metadataBase: new URL('https://fondealo.vercel.app'),
  title,
  description,
  keywords: [
    'Stellar',
    'Soroban',
    'USDC',
    'MYPE',
    'Perú',
    'financiamiento para empresas',
    'verificación de empresas',
    'Pasaporte de Empresa',
  ],
  openGraph: {
    title,
    description,
    url: 'https://fondealo.vercel.app',
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
