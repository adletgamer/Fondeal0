import { redirect } from 'next/navigation';
import { Card, Container } from '@fondealo/ui';
import { KybWizard } from '@/components/kyb-wizard';
import { ShieldCheck } from '@/components/icons';
import { getKybState } from '@/lib/data/kyb';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function VerifyBusinessPage() {
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  if (session.role !== 'Business')
    redirect(session.role === 'Investor' ? '/invest' : '/onboarding');
  const kyb = await getKybState(session.stellarAddress);

  return (
    <>
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mx-auto mb-8 max-w-2xl">
            <h1 className="font-display text-3xl font-bold text-slate-900">Verify your business</h1>
            <p className="mt-1 text-slate-500">
              Submit your business details for review. Verification, underwriting and Passport
              issuance are separate steps.
            </p>
          </div>

          {!kyb ? (
            <Card className="mx-auto max-w-2xl p-8 text-center">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Verification is temporarily unavailable
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                We could not check your application. Please try again later.
              </p>
            </Card>
          ) : kyb.eligible ? (
            <Card className="mx-auto max-w-2xl p-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <ShieldCheck width={26} height={26} />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-slate-900">
                {kyb.legalName} is approved
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {kyb.country}
                {kyb.reviewedAt
                  ? ` · verified ${new Date(kyb.reviewedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}`
                  : ''}
              </p>
              {kyb.providerRef ? (
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  Reference {kyb.providerRef}
                </p>
              ) : null}
              <a
                href="/business/passport"
                className="mt-5 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                View my Passport →
              </a>
            </Card>
          ) : kyb.status === 'Processing' ? (
            <Card className="mx-auto max-w-2xl p-8 text-center">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Application received
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                The sandbox checked input format only. KYB and underwriting remain pending; no
                verified Passport has been issued.
              </p>
              {kyb.providerRef ? (
                <p className="mt-3 font-mono text-[11px] text-slate-400">
                  Reference {kyb.providerRef}
                </p>
              ) : null}
            </Card>
          ) : kyb.status === 'Accepted' && kyb.provider !== 'sandbox' ? (
            <Card className="mx-auto max-w-2xl p-8 text-center">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Business identity reviewed
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Underwriting approval and Passport issuance are still required before financing.
              </p>
            </Card>
          ) : (
            <>
              {kyb.status === 'Accepted' && kyb.provider === 'sandbox' ? (
                <p className="mx-auto mb-4 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Your earlier sandbox result was a simulation. Submit a new application for real
                  review; it does not confer verified status.
                </p>
              ) : null}
              <KybWizard previouslyRejected={kyb.status === 'Rejected'} />
            </>
          )}
        </Container>
      </main>
    </>
  );
}
