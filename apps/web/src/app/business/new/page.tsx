import { Container } from '@fondealo/ui';
import { Navbar } from '@/components/navbar';
import { SectionTabs } from '@/components/section-tabs';
import { AddressLookupBanner } from '@/components/address-lookup-banner';
import { CollateralCalculatorForm } from '@/components/collateral-calculator-form';
import { getBorrowerPassport } from '@/lib/data/opportunities';

const TABS = [
  { href: '/business', label: 'Dashboard' },
  { href: '/business/new', label: 'New request' },
  { href: '/business/passport', label: 'Passport' },
];

export const dynamic = 'force-dynamic';

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const { address: rawAddress } = await searchParams;
  const address = rawAddress ?? 'GBODEGA…LIMA';
  const { passport } = await getBorrowerPassport(address);

  return (
    <>
      <Navbar />
      <SectionTabs tabs={TABS} active="/business/new" />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-slate-900">New financing request</h1>
            <p className="mt-1 text-slate-500">
              Every number below comes straight from your Passport and the §2 collateral config —
              nothing is a magic number.
            </p>
          </div>

          <div className="mb-6">
            <AddressLookupBanner address={rawAddress} action="/business/new" placeholderLabel="band" />
          </div>

          <CollateralCalculatorForm businessAddress={address} riskBand={passport.riskBand} />
        </Container>
      </main>
    </>
  );
}
