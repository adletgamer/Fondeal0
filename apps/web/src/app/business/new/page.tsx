import { redirect } from 'next/navigation';
import { Container } from '@fondealo/ui';
import { SectionTabs } from '@/components/section-tabs';
import { WalletStatusBar } from '@/components/wallet-status-bar';
import { CollateralCalculatorForm } from '@/components/collateral-calculator-form';
import { getBorrowerPassport } from '@/lib/data/opportunities';
import { getSession } from '@/lib/auth/session';
import { getKybState } from '@/lib/data/kyb';
import { getWalletSummary } from '@/lib/wallet/ledger';

const TABS = [
  { href: '/business', label: 'Dashboard' },
  { href: '/business/new', label: 'New request' },
  { href: '/business/passport', label: 'Passport' },
  { href: '/business/verify', label: 'Verification' },
];

export const dynamic = 'force-dynamic';

export default async function NewRequestPage() {
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  const address = session.stellarAddress;
  const kyb = await getKybState(address);
  if (kyb && kyb.status !== 'Accepted') redirect('/business/verify');
  const wallet = await getWalletSummary(address);
  const { passport } = await getBorrowerPassport(address);

  return (
    <>
      <SectionTabs tabs={TABS} active="/business/new" />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-slate-900">
              New financing request
            </h1>
            <p className="mt-1 text-slate-500">
              Every number below comes straight from your Passport and the §2 collateral config —
              nothing is a magic number.
            </p>
          </div>

          <div className="mb-6">
            <WalletStatusBar />
          </div>

          <CollateralCalculatorForm
            riskBand={passport.riskBand}
            balanceUsdc={wallet?.balanceUsdc ?? null}
          />
        </Container>
      </main>
    </>
  );
}
