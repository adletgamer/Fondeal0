import type { ReactNode } from 'react';
import { Navbar } from '@/components/navbar';
import { AuthGate } from '@/components/auth-gate';

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate section="business">
      <Navbar />
      {children}
    </AuthGate>
  );
}
