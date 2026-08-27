import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { AuthGate } from '@/components/auth-gate';
import { getSession } from '@/lib/auth/session';

export default async function BusinessLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session) {
    // Role escalation guard: an Investor never sees Business content, and a
    // logged-in user with no role yet goes back to onboarding to pick one —
    // never straight into a dashboard.
    if (session.role === 'Investor') redirect('/invest');
    if (session.role === null) redirect('/onboarding');
  }

  return (
    <AuthGate section="business">
      <Navbar />
      {children}
    </AuthGate>
  );
}
