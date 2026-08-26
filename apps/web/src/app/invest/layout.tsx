import type { ReactNode } from 'react';
import { Navbar } from '@/components/navbar';
import { AuthGate } from '@/components/auth-gate';

export default function InvestLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate section="invest">
      <Navbar />
      {children}
    </AuthGate>
  );
}
