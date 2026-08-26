import { Badge, Button, Card, Container } from '@fondealo/ui';
import { OpportunityStatus, RiskBand, type Opportunity } from '@fondealo/types';
import { Navbar } from '@/components/navbar';
import { Building, Coins, Landmark, TrendingUp } from '@/components/icons';
import { FundOpportunityForm } from '@/components/fund-opportunity-form';
import { listOpenOpportunities } from '@/lib/actions/opportunities';

/** Fetch live opportunities on every request; falls back to demo data below. */
export const dynamic = 'force-dynamic';

// Placeholder opportunities for the shell. Indexed from chain + Postgres in Phase 6.
const demoOpportunities: Opportunity[] = [
  {
    id: '1',
    business: 'GBODEGA…LIMA',
    title: 'Inventory financing — bodega, Lima',
    description: 'Restock for high season.',
    amount: '5000',
    funded: '3200',
    termDays: 90,
    aprBps: 1800,
    riskBand: RiskBand.B,
    status: OpportunityStatus.Open,
    createdAt: 1_766_000_000,
  },
  {
    id: '2',
    business: 'GTALLER…BOG',
    title: 'Equipment loan — taller, Bogotá',
    description: 'New machine.',
    amount: '12000',
    funded: '12000',
    termDays: 180,
    aprBps: 2200,
    riskBand: RiskBand.C,
    status: OpportunityStatus.Funded,
    createdAt: 1_765_000_000,
  },
  {
    id: '3',
    business: 'GTIENDA…CDMX',
    title: 'Working capital — tienda, CDMX',
    description: 'Bridge for receivables.',
    amount: '8000',
    funded: '2100',
    termDays: 120,
    aprBps: 2000,
    riskBand: RiskBand.B,
    status: OpportunityStatus.Open,
    createdAt: 1_766_500_000,
  },
];

const bandColor: Record<string, string> = {
  A: 'text-brand-700 bg-brand-50 border-brand-200',
  B: 'text-brand-700 bg-brand-50 border-brand-200',
  C: 'text-gold-600 bg-gold-50 border-gold-300/60',
  D: 'text-orange-600 bg-orange-50 border-orange-200',
  E: 'text-red-600 bg-red-50 border-red-200',
};

export default async function InvestorDashboard() {
  const live = await listOpenOpportunities();
  const isLive = Boolean(live && live.length > 0);
  const opportunities = isLive ? (live as Opportunity[]) : demoOpportunities;

  const stats = [
    { icon: Coins, label: 'Available USDC', value: '10,000' },
    { icon: TrendingUp, label: 'Deployed', value: '5,300' },
    { icon: Landmark, label: 'Est. annual return', value: '19.4%' },
  ];
  return (
    <>
      <Navbar />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">Investor dashboard</h1>
              <p className="mt-1 text-slate-500">
                Fund vetted SMEs scored by on-chain reputation, earn USDC.
              </p>
            </div>
            <Badge variant="gold">
              {isLive ? 'Live opportunities (Phase 6)' : 'Demo data — create one on the business dashboard'}
            </Badge>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label} className="flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <s.icon width={20} height={20} />
                </span>
                <div>
                  <div className="font-display text-2xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              </Card>
            ))}
          </div>

          <h2 className="mb-4 text-lg font-semibold text-slate-900">Open opportunities</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((o) => {
              const pct = Math.round((Number(o.funded) / Number(o.amount)) * 100);
              return (
                <Card key={o.id} className="flex flex-col p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${bandColor[o.riskBand] ?? ''}`}
                    >
                      Risk {o.riskBand}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{o.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <Building width={18} height={18} className="text-slate-400" />
                    <h3 className="font-semibold leading-tight">{o.title}</h3>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {Number(o.funded).toLocaleString()} USDC
                      </span>
                      <span className="text-slate-400">of {Number(o.amount).toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                    <span>{o.termDays} days</span>
                    <span className="font-semibold text-slate-700">
                      {(o.aprBps / 100).toFixed(1)}% APR
                    </span>
                  </div>

                  {isLive && o.status === OpportunityStatus.Open ? (
                    <FundOpportunityForm opportunityId={o.id} />
                  ) : (
                    <Button className="mt-5" disabled={o.status !== OpportunityStatus.Open}>
                      {o.status === OpportunityStatus.Open ? 'Fund in USDC' : 'Fully funded'}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
          {!isLive ? (
            <p className="mt-6 text-sm text-slate-400">
              These are demo opportunities. Create a real one from the{' '}
              <a href="/dashboard/business" className="text-brand-600 hover:underline">
                business dashboard
              </a>{' '}
              to fund it here for real.
            </p>
          ) : null}
        </Container>
      </main>
    </>
  );
}
