import { getAppTranslator } from '@/lib/app-locale';
import { redirect } from 'next/navigation';
import { Badge, Card, Container } from '@fondealo/ui';
import { DataSourceBadge } from '@/components/data-source-badge';
import { RiskDisclosure } from '@/components/risk-disclosure';
import { getInvestorPositions } from '@/lib/data/opportunities';
import { getSession } from '@/lib/auth/session';
import { getWalletSummary } from '@/lib/wallet/ledger';
import { BalanceCard } from '@/components/balance-card';
import { Coins, Landmark, ShieldCheck, TrendingUp } from '@/components/icons';

const DEPLOYED_STATUSES = new Set(['Open', 'Funded', 'Active']);
export const dynamic = 'force-dynamic';

export default async function InvestDashboard() {
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  if (session.role !== 'Investor')
    redirect(session.role === 'Business' ? '/business' : '/onboarding');
  const t = await getAppTranslator();

  const [{ source, positions }, wallet] = await Promise.all([
    getInvestorPositions(session.stellarAddress),
    getWalletSummary(session.stellarAddress),
  ]);

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
    { icon: Coins, label: 'Deployed', value: `${deployed.toLocaleString(t('__locale'))} USDC` },
    {
      icon: Landmark,
      label: 'Weighted APR',
      value: `${(weightedAprBps / 100).toLocaleString(t('__locale'), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
    },
    {
      icon: ShieldCheck,
      label: 'At risk (defaulted)',
      value: `${atRisk.toLocaleString(t('__locale'))} USDC`,
    },
    {
      icon: TrendingUp,
      label: 'Available USDC',
      value: wallet
        ? wallet.balanceUsdc.toLocaleString(t('__locale'), { maximumFractionDigits: 2 })
        : '—',
    },
  ];

  return (
    <>
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-brand-text">{t('Test portfolio')}</p>
              <h1 className="font-display text-3xl font-bold text-slate-900">
                {t('Investor dashboard')}
              </h1>
              <p className="mt-1 text-slate-500">
                {t('Portfolio KPIs across every opportunity you have funded.')}
              </p>
            </div>
            <DataSourceBadge source={source} />
          </div>

          <BalanceCard summary={wallet} className="mb-6" />

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-100 px-4 py-3 text-sm text-ink-muted">
            <p>
              {t('Active positions: {count}', {
                count: positions.filter((p) => DEPLOYED_STATUSES.has(p.status)).length,
              })}{' '}
              ·{' '}
              {t('Past due positions: {count}', {
                count: positions.filter((p) => p.status === 'Defaulted').length,
              })}
            </p>
            <a href="/invest/market" className="font-semibold text-brand-text hover:underline">
              {t('Explore test market')} →
            </a>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.label} className="flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <k.icon width={20} height={20} />
                </span>
                <div>
                  <div className="font-display text-2xl font-bold text-slate-900">{k.value}</div>
                  <div className="text-xs text-slate-500">{t(k.label)}</div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{t('Recent positions')}</h2>
            <a
              href="/invest/positions"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {t('View all')}
            </a>
          </div>

          {positions.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 px-8 py-12 text-center">
              <span className="text-lg font-semibold text-slate-900">{t('No positions yet')}</span>
              <p className="max-w-sm text-sm text-slate-500">
                {t('Browse the marketplace and fund your first opportunity to see it here.')}
              </p>
              <a href="/invest/market">
                <Badge variant="brand">{t('Go to Market →')}</Badge>
              </a>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t('Opportunity')}</th>
                    <th className="px-4 py-3 font-semibold">{t('Your position')}</th>
                    <th className="px-4 py-3 font-semibold">{t('APR')}</th>
                    <th className="px-4 py-3 font-semibold">{t('Status')}</th>
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
                        {Number(p.investorAmount).toLocaleString(t('__locale'))} USDC
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {(p.aprBps / 100).toLocaleString(t('__locale'), {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        %
                      </td>
                      <td className="px-4 py-3 text-slate-500">{t(p.status)}</td>
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
