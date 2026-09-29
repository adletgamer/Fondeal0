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

const title = 'Fondealo — Portable credit infrastructure for Latin American businesses';
const description =
  'A reusable Business Passport and a portable, on-chain credit reputation that grows with every repayment. Credit infrastructure for Latin American businesses, built on Stellar, Soroban and USDC.';

export const metadata: Metadata = {
  metadataBase: new URL('https://fondealo.vercel.app'),
  title,
  description,
  keywords: [
    'Stellar',
    'Soroban',
    'USDC',
    'SME credit',
    'Latin America',
    'on-chain reputation',
    'DeFi',
    'Business Passport',
  ],
  openGraph: {
    title,
    description,
    url: 'https://fondealo.vercel.app',
    siteName: 'Fondealo',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Night is the default theme; the init script swaps in a saved choice
    // before first paint, hence suppressHydrationWarning on <html>.
    <html
      lang="en"
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
