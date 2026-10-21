import { redirect } from 'next/navigation';
import { Container } from '@fondealo/ui';
import { ApplicationStatusCard } from '@/components/application-status-card';
import { KybWizard } from '@/components/kyb-wizard';
import { applicationStatus } from '@/lib/application-status';
import { getKybState } from '@/lib/data/kyb';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function VerifyBusinessPage() {
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  if (session.role !== 'Business')
    redirect(session.role === 'Investor' ? '/invest' : '/onboarding');
  const kyb = await getKybState(session.stellarAddress);
  const status = applicationStatus(kyb);

  return (
    <>
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mx-auto mb-8 max-w-2xl">
            <h1 className="font-display text-3xl font-bold text-slate-900">Verifica tu empresa</h1>
            <p className="mt-1 text-slate-600">
              Envía los datos de tu empresa para revisión. La verificación, la evaluación y la
              emisión del Pasaporte son pasos separados.
            </p>
          </div>

          {status.kind !== 'none' ? (
            <ApplicationStatusCard
              status={status}
              // When the form is shown below, it is the next step.
              showAction={!status.canSubmit}
              className="mx-auto mb-6 max-w-2xl"
            />
          ) : null}

          {status.canSubmit ? <KybWizard previouslyRejected={kyb?.status === 'Rejected'} /> : null}

          {status.kind === 'verified' && kyb?.providerRef ? (
            <p className="mx-auto max-w-2xl font-mono text-xs text-slate-500">
              Referencia {kyb.providerRef}
            </p>
          ) : null}
        </Container>
      </main>
    </>
  );
}
