import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Instrument_Sans, Space_Grotesk } from 'next/font/google';
import { PrivyProviders } from '@/components/privy-providers';
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
    <html
      lang="en"
      className={`${instrumentSans.variable} ${spaceGrotesk.variable} ${fraunces.variable}`}
    >
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <PrivyProviders>{children}</PrivyProviders>
      </body>
    </html>
  );
}
