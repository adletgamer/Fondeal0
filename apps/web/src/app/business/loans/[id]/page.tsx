import { notFound } from 'next/navigation';
import { Badge, Card, Container } from '@fondealo/ui';
import { buildRepaymentSchedule, requiredCollateral } from '@fondealo/types';
import { Navbar } from '@/components/navbar';
import { RepayForm } from '@/components/repay-form';
import { DataSourceBadge } from '@/components/data-source-badge';
import { getOpportunityDetail, getRepaidSoFar } from '@/lib/data/opportunities';
import { Calendar } from '@/components/icons';

export const dynamic = 'force-dynamic';

function installmentsFor(termDays: number): number {
  return Math.max(1, Math.min(12, Math.round(termDays / 30)));
}

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { source, opportunity } = await getOpportunityDetail(id);
  if (!opportunity) notFound();

  const collateral = requiredCollateral(opportunity.amount, opportunity.riskBand);
  const schedule = buildRepaymentSchedule(
    opportunity.amount,
    opportunity.aprBps,
    opportunity.termDays,
    installmentsFor(opportunity.termDays),
  );
  const totalDue = schedule.reduce((sum, s) => sum + Number(s.total), 0);
  const repaidSoFar = opportunity.status === 'Repaid' ? totalDue : await getRepaidSoFar(opportunity.id);
  const remaining = Math.max(0, totalDue - repaidSoFar);

  return (
    <>
      <Navbar />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="neutral">Risk {opportunity.riskBand}</Badge>
                <Badge variant={opportunity.status === 'Repaid' ? 'brand' : 'neutral'}>
                  {opportunity.status}
                </Badge>
                <DataSourceBadge source={source} />
              </div>
              <h1 className="font-display text-3xl font-bold text-slate-900">
                {opportunity.title}
              </h1>
            </div>
            <a href="/business" className="text-sm font-medium text-brand-600 hover:underline">
              ← Back to dashboard
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="grid content-start gap-6">
              <Card className="p-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Principal" value={`${Number(opportunity.amount).toLocaleString()} USDC`} />
                  <Stat label="Collateral locked" value={`${Number(collateral).toLocaleString()} USDC`} />
                  <Stat label="Total due" value={`${totalDue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`} />
                  <Stat
                    label="Remaining"
                    value={`${remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`}
                    accent={remaining === 0}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar width={18} height={18} className="text-slate-400" />
                  <h2 className="text-lg font-semibold text-slate-900">Repayment schedule</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="py-2 font-semibold">#</th>
                        <th className="py-2 font-semibold">Due</th>
                        <th className="py-2 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((s) => (
                        <tr key={s.index} className="border-t border-slate-100">
                          <td className="py-2.5 text-slate-500">{s.index}</td>
                          <td className="py-2.5 text-slate-600">Day {s.dueInDays}</td>
                          <td className="py-2.5 text-right font-semibold text-slate-900">
                            {Number(s.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="grid content-start gap-6">
              {opportunity.status === 'Funded' || opportunity.status === 'Active' ? (
                <RepayForm opportunityId={opportunity.id} remaining={remaining} />
              ) : opportunity.status === 'Repaid' ? (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-emerald-700">Fully repaid</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Collateral returned, score updated. Nothing else to do here.
                  </p>
                </Card>
              ) : (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Not yet fundable</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    This loan isn&apos;t fully funded yet — payments open once investors have funded
                    it in full.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-0.5 font-display text-lg font-bold ${accent ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}
