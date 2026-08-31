import { notFound } from 'next/navigation';
import { Badge, Card, Container } from '@fondealo/ui';
import { buildRepaymentSchedule, maxProtectedPct, requiredCollateral } from '@fondealo/types';
import { PassportV2 } from '@/components/passport-v2';
import { FundPanel } from '@/components/fund-panel';
import { DataSourceBadge } from '@/components/data-source-badge';
import { RiskDisclosure } from '@/components/risk-disclosure';
import { getBorrowerPassport, getOpportunityDetail } from '@/lib/data/opportunities';
import { Calendar, ShieldCheck } from '@/components/icons';

export const dynamic = 'force-dynamic';

function installmentsFor(termDays: number): number {
  return Math.max(1, Math.min(12, Math.round(termDays / 30)));
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { source, opportunity } = await getOpportunityDetail(id);
  if (!opportunity) notFound();

  const { passport } = await getBorrowerPassport(opportunity.business);

  const collateral = requiredCollateral(opportunity.amount, opportunity.riskBand);
  const protectedPct = maxProtectedPct(opportunity.riskBand);
  const remaining = Math.max(0, Number(opportunity.amount) - Number(opportunity.funded));
  const schedule = buildRepaymentSchedule(
    opportunity.amount,
    opportunity.aprBps,
    opportunity.termDays,
    installmentsFor(opportunity.termDays),
  );
  const totalDue = schedule.reduce((sum, s) => sum + Number(s.total), 0);
  const fundedPct = Math.round((Number(opportunity.funded) / Number(opportunity.amount)) * 100);

  return (
    <>
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="neutral">Risk {opportunity.riskBand}</Badge>
                <Badge variant="neutral">{opportunity.status}</Badge>
                <DataSourceBadge source={source} />
              </div>
              <h1 className="font-display text-3xl font-bold text-slate-900">
                {opportunity.title}
              </h1>
              <p className="mt-1 font-mono text-sm text-slate-400">{opportunity.business}</p>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl font-bold text-slate-900">
                {(opportunity.aprBps / 100).toFixed(1)}%
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                APR over {opportunity.termDays} days
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="grid content-start gap-6">
              <Card className="p-6">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {Number(opportunity.funded).toLocaleString()} USDC raised
                  </span>
                  <span className="text-slate-400">
                    of {Number(opportunity.amount).toLocaleString()} ({fundedPct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.min(100, fundedPct)}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
                  <Stat
                    label="Principal"
                    value={`${Number(opportunity.amount).toLocaleString()} USDC`}
                  />
                  <Stat
                    label="Collateral locked"
                    value={`${Number(collateral).toLocaleString()} USDC`}
                  />
                  <Stat label="Max protected" value={`${protectedPct}%`} accent />
                  <Stat label="Term" value={`${opportunity.termDays} days`} />
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700">
                  <ShieldCheck width={14} height={14} />
                  Collateral covers the first {protectedPct}% of any loss before investor capital is
                  at risk.
                </div>
              </Card>

              <div>
                <h2 className="mb-3 text-lg font-semibold text-slate-900">The business</h2>
                <PassportV2 passport={passport} />
              </div>

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
                        <th className="py-2 text-right font-semibold">Principal</th>
                        <th className="py-2 text-right font-semibold">Interest</th>
                        <th className="py-2 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((s) => (
                        <tr key={s.index} className="border-t border-slate-100">
                          <td className="py-2.5 text-slate-500">{s.index}</td>
                          <td className="py-2.5 text-slate-600">Day {s.dueInDays}</td>
                          <td className="py-2.5 text-right text-slate-700">
                            {Number(s.principal).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2.5 text-right text-slate-700">
                            {Number(s.interest).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-slate-900">
                            {Number(s.total).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200">
                        <td
                          colSpan={4}
                          className="py-2.5 text-right text-sm font-medium text-slate-500"
                        >
                          Total due
                        </td>
                        <td className="py-2.5 text-right text-sm font-bold text-slate-900">
                          {totalDue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>

              <RiskDisclosure />
            </div>

            <div className="grid content-start gap-6">
              <FundPanel
                opportunityId={opportunity.id}
                remaining={remaining}
                aprBps={opportunity.aprBps}
                termDays={opportunity.termDays}
                isOpen={opportunity.status === 'Open'}
              />
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div
        className={`mt-0.5 font-display text-lg font-bold ${accent ? 'text-emerald-600' : 'text-slate-900'}`}
      >
        {value}
      </div>
    </div>
  );
}
