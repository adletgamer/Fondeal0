import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@fondealo/ui';
import { OpportunityStatus, RiskBand, type Opportunity } from '@fondealo/types';

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
];

export default function InvestorDashboard() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Investor dashboard</h1>
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← Home
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {demoOpportunities.map((o) => (
          <Card key={o.id}>
            <CardHeader>
              <CardTitle>{o.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="rounded-full bg-slate-100 px-2 py-1 font-medium">
                  Risk {o.riskBand}
                </span>
                <span className="text-slate-500">{o.status}</span>
              </div>
              <div className="mb-1 text-sm text-slate-600">
                {Number(o.funded).toLocaleString()} / {Number(o.amount).toLocaleString()} USDC
              </div>
              <div className="text-sm text-slate-500">
                {o.termDays} days · {(o.aprBps / 100).toFixed(1)}% APR
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">
        USDC deposit &amp; funding flow ships in Phase 6.
      </p>
    </main>
  );
}
