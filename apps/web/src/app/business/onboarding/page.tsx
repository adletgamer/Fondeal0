import { redirect } from 'next/navigation';
import { Container, Card } from '@fondealo/ui';
import { getSession } from '@/lib/auth/session';
import { getAppLocale } from '@/lib/app-locale';
import { getBusinessOnboardingState } from '@/lib/data/business-onboarding';
import { BusinessProfileWizard } from '@/components/business-profile-wizard';

export const dynamic = 'force-dynamic';

export default async function BusinessOnboardingPage() {
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  if (session.role !== 'Business')
    redirect(session.role === 'Investor' ? '/invest' : '/onboarding');
  const [state, locale] = await Promise.all([getBusinessOnboardingState(session), getAppLocale()]);
  return (
    <main className="bg-surface-0 pb-20 text-ink">
      <Container className="py-10">
        <div className="mx-auto mb-8 max-w-2xl">
          <h1 className="font-display text-3xl font-semibold">
            {locale === 'es'
              ? 'El perfil financiero de tu empresa'
              : 'Your company’s financial profile'}
          </h1>
          <p className="mt-3 text-ink-muted">
            {locale === 'es'
              ? 'Cuéntanos cómo funciona tu empresa. Sin documentos y sin compromiso de financiamiento.'
              : 'Tell us how your company operates. No documents and no financing commitment.'}
          </p>
        </div>
        {state.kind === 'UNAVAILABLE' ? (
          <Card className="mx-auto max-w-2xl p-6">
            <p role="alert">
              {locale === 'es'
                ? 'No pudimos cargar tu perfil. Puedes seguir usando tu panel e intentarlo más tarde.'
                : 'We couldn’t load your profile. You can keep using your dashboard and try again later.'}
            </p>
            <a href="/business" className="mt-4 inline-block text-brand-text underline">
              {locale === 'es' ? 'Volver a mi empresa' : 'Back to my company'}
            </a>
          </Card>
        ) : (
          <BusinessProfileWizard initial={state.initial} />
        )}
      </Container>
    </main>
  );
}
