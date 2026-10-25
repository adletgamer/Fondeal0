import { getAppTranslator } from '@/lib/app-locale';
import { Container } from '@fondealo/ui';
import { DataSourceBadge } from '@/components/data-source-badge';
import { MarketGrid } from '@/components/market-grid';
import { RiskDisclosure } from '@/components/risk-disclosure';
import { getMarketOpportunities } from '@/lib/data/opportunities';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MarketPage() {
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  if (session.role !== 'Investor')
    redirect(session.role === 'Business' ? '/business' : '/onboarding');
  const t = await getAppTranslator();

  const { source, opportunities } = await getMarketOpportunities();

  return (
    <>
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">{t('Marketplace')}</h1>
              <p className="mt-1 text-slate-500">
                {t(
                  'Every figure below — APR, collateral coverage — comes from the risk-band config in docs/product-v2.md §2, not a magic number per card.',
                )}
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
