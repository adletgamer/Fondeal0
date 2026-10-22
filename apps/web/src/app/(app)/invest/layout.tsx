import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { AuthGate } from '@/components/auth-gate';
import { getSession } from '@/lib/auth/session';

export default async function InvestLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session) {
    // Role escalation guard: a Business account never sees Investor content,
    // and a logged-in user with no role yet goes back to onboarding to pick
    // one — never straight into a dashboard.
    if (session.role === 'Business') redirect('/business');
    if (session.role === null) redirect('/onboarding');
  }

  return (
    <AuthGate section="invest">
      {session?.role === 'Investor' && session.stellarAddress ? (
        <AppShell role="Investor" address={session.stellarAddress}>
          {children}
        </AppShell>
      ) : (
        children
      )}
    </AuthGate>
  );
}
