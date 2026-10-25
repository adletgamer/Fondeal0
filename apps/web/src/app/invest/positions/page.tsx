import { getAppTranslator } from '@/lib/app-locale';
import { redirect } from 'next/navigation';
import { Badge, Card, Container } from '@fondealo/ui';
import { DataSourceBadge } from '@/components/data-source-badge';
import { getInvestorPositions } from '@/lib/data/opportunities';
import { getSession } from '@/lib/auth/session';

const STATUS_TONE: Record<string, string> = {
  Open: 'border-brand-300 text-brand-700',
  Funded: 'border-brand-400 text-brand-700',
  Active: 'border-gold-400 text-gold-600',
  Repaid: 'border-emerald-400 text-emerald-700',
  Defaulted: 'border-red-300 text-red-600',
};

export const dynamic = 'force-dynamic';

export default async function PositionsPage() {
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  if (session.role !== 'Investor')
    redirect(session.role === 'Business' ? '/business' : '/onboarding');
  const t = await getAppTranslator();

  const { source, positions } = await getInvestorPositions(session.stellarAddress);

  return (
    <>
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">
                {t('Your positions')}
              </h1>
              <p className="mt-1 text-slate-500">
                {t('Every opportunity you have funded, past and present.')}
              </p>
            </div>
            <DataSourceBadge source={source} />
          </div>

          <p className="mb-5 text-sm text-ink-muted">
            {t('Estimated totals follow the scenario terms; they are not recorded payouts.')}
          </p>

          {positions.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 px-8 py-14 text-center">
              <span className="text-lg font-semibold text-slate-900">{t('No positions yet')}</span>
              <p className="max-w-sm text-sm text-slate-500">
                {t('Nothing funded under this address yet.')}
              </p>
              <a href="/invest/market">
                <Badge variant="brand">{t('Browse the market →')}</Badge>
              </a>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t('Opportunity')}</th>
                    <th className="px-4 py-3 text-right font-semibold">{t('Invested')}</th>
                    <th className="px-4 py-3 text-right font-semibold">{t('Expected return')}</th>
                    <th className="px-4 py-3 font-semibold">{t('Collateral coverage')}</th>
                    <th className="px-4 py-3 font-semibold">{t('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const expected =
                      Number(p.investorAmount) * (1 + (p.aprBps / 10_000) * (p.termDays / 365));
                    return (
                      <tr
                        key={p.opportunityId}
                        className="border-b border-slate-50 last:border-b-0"
                      >
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
                          {Number(p.investorAmount).toLocaleString(t('__locale'))} USDC
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {expected.toLocaleString(t('__locale'), { maximumFractionDigits: 2 })}{' '}
                          USDC
                          <span className="ml-1.5 text-xs text-slate-500">{t('(realized)')}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {t('Risk')} {p.riskBand}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border bg-white px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[p.status] ?? 'border-slate-200 text-slate-500'}`}
                          >
                            {t(p.status)}
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
