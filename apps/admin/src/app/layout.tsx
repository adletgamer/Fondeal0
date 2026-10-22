import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Onest, Unbounded } from 'next/font/google';
import '@fondealo/ui/styles.css';
import './globals.css';

const onest = Onest({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });
const unbounded = Unbounded({
  subsets: ['latin', 'latin-ext'],
  weight: ['600'],
  variable: '--font-brand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Administración — Fondealo',
  description: 'Panel interno de revisión.',
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE" data-theme="dark" className={`${onest.variable} ${unbounded.variable}`}>
      <body className="min-h-screen bg-surface-0 font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
