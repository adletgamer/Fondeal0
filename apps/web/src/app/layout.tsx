import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const title = 'Fondealo — On-chain credit for LatAm SMEs, on Stellar';
const description =
  'A reusable Business Passport and a portable, on-chain credit reputation that grows with every repayment. Credit infrastructure for Latin American SMEs, built on Stellar, Soroban and USDC.';

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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
