import { Badge, Card, Container } from '@fondealo/ui';
import { Navbar } from '@/components/navbar';
import { SectionTabs } from '@/components/section-tabs';
import { AddressLookupBanner } from '@/components/address-lookup-banner';
import { DataSourceBadge } from '@/components/data-source-badge';
import { getInvestorPositions } from '@/lib/data/opportunities';

const TABS = [
  { href: '/invest', label: 'Dashboard' },
  { href: '/invest/market', label: 'Market' },
  { href: '/invest/positions', label: 'Positions' },
];

const STATUS_TONE: Record<string, string> = {
  Open: 'border-brand-300 text-brand-700',
  Funded: 'border-brand-400 text-brand-700',
  Active: 'border-gold-400 text-gold-600',
  Repaid: 'border-emerald-400 text-emerald-700',
  Defaulted: 'border-red-300 text-red-600',
};

export const dynamic = 'force-dynamic';

export default async function PositionsPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const { address } = await searchParams;
  const { source, positions } = await getInvestorPositions(address ?? 'no-session');

  return (
    <>
      <Navbar />
      <SectionTabs tabs={TABS} active="/invest/positions" />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">Your positions</h1>
              <p className="mt-1 text-slate-500">Every opportunity you have funded, past and present.</p>
            </div>
            <DataSourceBadge source={source} />
          </div>

          <div className="mb-6">
            <AddressLookupBanner address={address} action="/invest/positions" placeholderLabel="positions" />
          </div>

          {positions.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 px-8 py-14 text-center">
              <span className="text-lg font-semibold text-slate-900">No positions yet</span>
              <p className="max-w-sm text-sm text-slate-500">
                Nothing funded under this address yet.
              </p>
              <a href="/invest/market">
                <Badge variant="brand">Browse the market →</Badge>
              </a>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Opportunity</th>
                    <th className="px-4 py-3 text-right font-semibold">Invested</th>
                    <th className="px-4 py-3 text-right font-semibold">Expected return</th>
                    <th className="px-4 py-3 font-semibold">Collateral coverage</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const expected =
                      Number(p.investorAmount) *
                      (1 + (p.aprBps / 10_000) * (p.termDays / 365));
                    return (
                      <tr key={p.opportunityId} className="border-b border-slate-50 last:border-b-0">
                        <td className="px-4 py-3">
                          <a
                            href={`/invest/opportunity/${p.opportunityId}`}
                            className="font-medium text-slate-800 hover:text-brand-700 hover:underline"
                          >
                            {p.title}
                          </a>
                          <div className="font-mono text-xs text-slate-400">{p.business}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          {Number(p.investorAmount).toLocaleString()} USDC
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {expected.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                          {p.status === 'Repaid' ? (
                            <span className="ml-1.5 text-xs text-emerald-600">(realized)</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-500">Risk {p.riskBand}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border bg-white px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[p.status] ?? 'border-slate-200 text-slate-500'}`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </main>
    </>
  );
}
