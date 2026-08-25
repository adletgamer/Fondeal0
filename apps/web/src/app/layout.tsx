import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fondealo — Credit infrastructure for LatAm SMEs on Stellar',
  description:
    'Reusable Business Passport and portable on-chain credit reputation for Latin American SMEs, built on Stellar and Soroban.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
