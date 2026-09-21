import { redirect } from 'next/navigation';
import { Card, Container } from '@fondealo/ui';
import { SectionTabs } from '@/components/section-tabs';
import { KybWizard } from '@/components/kyb-wizard';
import { ShieldCheck } from '@/components/icons';
import { getKybState } from '@/lib/data/kyb';
import { getSession } from '@/lib/auth/session';

const TABS = [
  { href: '/business', label: 'Dashboard' },
  { href: '/business/new', label: 'New request' },
  { href: '/business/passport', label: 'Passport' },
  { href: '/business/verify', label: 'Verification' },
];

export const dynamic = 'force-dynamic';

export default async function VerifyBusinessPage() {
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  const kyb = await getKybState(session.stellarAddress);

  return (
    <>
      <SectionTabs tabs={TABS} active="/business/verify" />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mx-auto mb-8 max-w-2xl">
            <h1 className="font-display text-3xl font-bold text-slate-900">Verify your business</h1>
            <p className="mt-1 text-slate-500">
              Verification unlocks your Business Passport and lets you request USDC financing. It
              takes about a minute.
            </p>
          </div>

          {kyb?.status === 'Accepted' ? (
            <Card className="mx-auto max-w-2xl p-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <ShieldCheck width={26} height={26} />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-slate-900">
                {kyb.legalName} is verified
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
          ) : (
            <KybWizard previouslyRejected={kyb?.status === 'Rejected'} />
          )}
        </Container>
      </main>
    </>
  );
}
