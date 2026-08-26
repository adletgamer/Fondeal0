import { Badge, Card, Container } from '@fondealo/ui';
import { Navbar } from '@/components/navbar';
import { SectionTabs } from '@/components/section-tabs';
import { AddressLookupBanner } from '@/components/address-lookup-banner';
import { DataSourceBadge } from '@/components/data-source-badge';
import { RiskDisclosure } from '@/components/risk-disclosure';
import { getInvestorPositions } from '@/lib/data/opportunities';
import { Coins, Landmark, ShieldCheck, TrendingUp } from '@/components/icons';

const TABS = [
  { href: '/invest', label: 'Dashboard' },
  { href: '/invest/market', label: 'Market' },
  { href: '/invest/positions', label: 'Positions' },
];

const DEPLOYED_STATUSES = new Set(['Open', 'Funded', 'Active']);

export default async function InvestDashboard({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const { address } = await searchParams;
  // No address on file yet -> getInvestorPositions finds nothing on-chain or
  // in the database and returns the labeled demo tier itself.
  const { source, positions } = await getInvestorPositions(address ?? 'no-session');

  const deployed = positions
    .filter((p) => DEPLOYED_STATUSES.has(p.status))
    .reduce((sum, p) => sum + Number(p.investorAmount), 0);
  const atRisk = positions
    .filter((p) => p.status === 'Defaulted')
    .reduce((sum, p) => sum + Number(p.investorAmount), 0);
  const weightedAprBps = (() => {
    const deployedPositions = positions.filter((p) => DEPLOYED_STATUSES.has(p.status));
    const total = deployedPositions.reduce((sum, p) => sum + Number(p.investorAmount), 0);
    if (total === 0) return 0;
    const weighted = deployedPositions.reduce(
      (sum, p) => sum + Number(p.investorAmount) * p.aprBps,
      0,
    );
    return Math.round(weighted / total);
  })();

  const kpis = [
    { icon: Coins, label: 'Deployed', value: `${deployed.toLocaleString()} USDC` },
    { icon: Landmark, label: 'Weighted APR', value: `${(weightedAprBps / 100).toFixed(1)}%` },
    {
      icon: ShieldCheck,
      label: 'At risk (defaulted)',
      value: `${atRisk.toLocaleString()} USDC`,
    },
    { icon: TrendingUp, label: 'Available USDC', value: '—' },
  ];

  return (
    <>
      <Navbar />
      <SectionTabs tabs={TABS} active="/invest" />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">Investor dashboard</h1>
              <p className="mt-1 text-slate-500">
                Portfolio KPIs across every opportunity you have funded.
              </p>
            </div>
            <DataSourceBadge source={source} />
          </div>

          <div className="mb-6">
            <AddressLookupBanner address={address} action="/invest" placeholderLabel="portfolio" />
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.label} className="flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <k.icon width={20} height={20} />
                </span>
                <div>
                  <div className="font-display text-2xl font-bold text-slate-900">{k.value}</div>
                  <div className="text-xs text-slate-500">{k.label}</div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent positions</h2>
            <a href="/invest/positions" className="text-sm font-medium text-brand-600 hover:underline">
              View all
            </a>
          </div>

          {positions.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 px-8 py-12 text-center">
              <span className="text-lg font-semibold text-slate-900">No positions yet</span>
              <p className="max-w-sm text-sm text-slate-500">
                Browse the marketplace and fund your first opportunity to see it here.
              </p>
              <a href="/invest/market">
                <Badge variant="brand">Go to Market →</Badge>
              </a>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Opportunity</th>
                    <th className="px-4 py-3 font-semibold">Your position</th>
                    <th className="px-4 py-3 font-semibold">APR</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.slice(0, 5).map((p) => (
                    <tr key={p.opportunityId} className="border-b border-slate-50 last:border-b-0">
                      <td className="px-4 py-3">
                        <a
                          href={`/invest/opportunity/${p.opportunityId}`}
                          className="font-medium text-slate-800 hover:text-brand-700 hover:underline"
                        >
                          {p.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {Number(p.investorAmount).toLocaleString()} USDC
                      </td>
                      <td className="px-4 py-3 text-slate-600">{(p.aprBps / 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-slate-500">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <RiskDisclosure className="mt-8" />
        </Container>
      </main>
    </>
  );
}
