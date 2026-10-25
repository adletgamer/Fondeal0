import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { OnboardingFlow } from '@/components/onboarding-flow';
import { getSession } from '@/lib/auth/session';
import { getAppLocale } from '@/lib/app-locale';
import { AppLocaleProvider } from '@/components/app-locale-provider';

/**
 * Onboarding states 2–4 (login → role selection → persist). A signed-in
 * user who already has a role is bounced straight to their section server
 * side — no client flash of the role-selection screen they've already
 * passed.
 */
export default async function OnboardingPage() {
  const session = await getSession();
  if (session?.role === 'Business') redirect('/business');
  if (session?.role === 'Investor') redirect('/invest');

  return (
    <AppLocaleProvider locale={await getAppLocale()}>
      <Navbar />
      <OnboardingFlow
        hasServerSession={Boolean(session)}
        hasServerWallet={Boolean(session?.stellarAddress)}
        accountServiceUnavailable={Boolean(session?.accountServiceUnavailable)}
      />
    </AppLocaleProvider>
  );
}
