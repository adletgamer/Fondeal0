import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Instrument_Sans, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { PrivyProviders } from '@/components/privy-providers';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import '@fondealo/ui/styles.css';
import './globals.css';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  style: ['normal', 'italic'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Ledger type: addresses, hashes, amounts.
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
    icon: [{ url: '/orbital-badge.png?v=2', type: 'image/png' }],
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
      className={`${instrumentSans.variable} ${spaceGrotesk.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
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
