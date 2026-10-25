import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fondealo · KYB Review (local)',
  description: 'Prototipo local con casos sintéticos; no conectado a datos reales.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE">
      <body>{children}</body>
    </html>
  );
}
