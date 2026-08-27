import { redirect } from 'next/navigation';
import { Badge, Card, Container } from '@fondealo/ui';
import { COLLATERAL_CONFIG_V1, RiskBand, requiredCollateral } from '@fondealo/types';
import { SectionTabs } from '@/components/section-tabs';
import { WalletStatusBar } from '@/components/wallet-status-bar';
import { DataSourceBadge } from '@/components/data-source-badge';
import { PassportCard } from '@/components/passport-card';
import { getBorrowerPassport, getBusinessOpportunities } from '@/lib/data/opportunities';
import { getSession } from '@/lib/auth/session';
import { Calendar, Coins, Plus, ShieldCheck } from '@/components/icons';

const TABS = [
  { href: '/business', label: 'Dashboard' },
  { href: '/business/new', label: 'New request' },
  { href: '/business/passport', label: 'Passport' },
];

const BAND_ORDER = Object.values(RiskBand);
const ACTIVE_STATUSES = new Set(['Open', 'Funded', 'Active']);

export const dynamic = 'force-dynamic';

export default async function BusinessDashboard() {
  // The layout above already verified the session and matched its role to
  // this section, and a role can only be persisted once a Stellar address
  // exists (see chooseRole) — so `stellarAddress` here is never null in
  // practice. The redirect is defense in depth, not the primary guard.
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  const address = session.stellarAddress;

  const [{ source: passportSource, passport }, { source: loansSource, opportunities }] =
    await Promise.all([getBorrowerPassport(address), getBusinessOpportunities(address)]);

  const activeLoans = opportunities.filter((o) => ACTIVE_STATUSES.has(o.status));
  const totalCollateralLocked = activeLoans.reduce(
    (sum, o) => sum + Number(requiredCollateral(o.amount, o.riskBand)),
    0,
  );
  const nextDue = activeLoans
    .filter((o) => o.status === 'Funded' || o.status === 'Active')
    .map((o) => ({ opportunity: o, dueAt: o.createdAt + o.termDays * 86_400 }))
    .sort((a, b) => a.dueAt - b.dueAt)[0];

  const currentRatioBps = COLLATERAL_CONFIG_V1[passport.riskBand].collateralRatioBps;
  const bandIndex = BAND_ORDER.indexOf(passport.riskBand);
  const nextBand = bandIndex > 0 ? BAND_ORDER[bandIndex - 1] : null;
  const nextRatioBps = nextBand ? COLLATERAL_CONFIG_V1[nextBand].collateralRatioBps : null;

  return (
    <>
      <SectionTabs tabs={TABS} active="/business" />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">Business dashboard</h1>
              <p className="mt-1 text-slate-500">
                Your Passport, active loans, and collateral — in one place.
              </p>
            </div>
            <div className="flex gap-2">
              <DataSourceBadge source={loansSource === 'demo' ? loansSource : passportSource} />
              <a href="/business/new">
                <Badge variant="brand">
                  <Plus width={12} height={12} /> New request
                </Badge>
              </a>
            </div>
          </div>

          <div className="mb-6">
            <WalletStatusBar />
          </div>

          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <PassportCard passport={passport} />

            <div className="grid content-start gap-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Coins width={16} height={16} />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Collateral locked
                    </span>
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold text-slate-900">
                    {totalCollateralLocked.toLocaleString()} USDC
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar width={16} height={16} />
                    <span className="text-xs font-semibold uppercase tracking-wide">Next payment</span>
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold text-slate-900">
                    {nextDue ? new Date(nextDue.dueAt * 1000).toLocaleDateString() : '—'}
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ShieldCheck width={16} height={16} />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Capital efficiency
                    </span>
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold text-slate-900">
                    {currentRatioBps / 100}% collateral
                  </div>
                  {nextBand && nextRatioBps !== null ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Band {nextBand} would need only {nextRatioBps / 100}%.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-emerald-600">Best band already.</p>
                  )}
                </Card>
              </div>

              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Your loans</h2>
                  <a href="/business/new" className="text-sm font-medium text-brand-600 hover:underline">
                    + New request
                  </a>
                </div>
                {opportunities.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No requests yet. Create one to start building reputation.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {opportunities.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <a
                            href={`/business/loans/${o.id}`}
                            className="truncate text-sm font-medium text-slate-800 hover:text-brand-700 hover:underline"
                          >
                            {o.title}
                          </a>
                          <div className="text-xs text-slate-500">
                            {Number(o.funded).toLocaleString()} / {Number(o.amount).toLocaleString()} USDC
                            &nbsp;· {o.termDays}d · {(o.aprBps / 100).toFixed(1)}% APR
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {o.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
