import { Container } from '@fondealo/ui';
import { SectionTabs } from '@/components/section-tabs';
import { DataSourceBadge } from '@/components/data-source-badge';
import { MarketGrid } from '@/components/market-grid';
import { RiskDisclosure } from '@/components/risk-disclosure';
import { getMarketOpportunities } from '@/lib/data/opportunities';

const TABS = [
  { href: '/invest', label: 'Dashboard' },
  { href: '/invest/market', label: 'Market' },
  { href: '/invest/positions', label: 'Positions' },
];

export const dynamic = 'force-dynamic';

export default async function MarketPage() {
  const { source, opportunities } = await getMarketOpportunities();

  return (
    <>
      <SectionTabs tabs={TABS} active="/invest/market" />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">Marketplace</h1>
              <p className="mt-1 text-slate-500">
                Every figure below — APR, collateral coverage — comes from the risk-band config in
                docs/product-v2.md §2, not a magic number per card.
              </p>
            </div>
            <DataSourceBadge source={source} />
          </div>

          <MarketGrid opportunities={opportunities} />
          <RiskDisclosure className="mt-8" />
        </Container>
      </main>
    </>
  );
}
