import { Card, Container } from '@fondealo/ui';
import { COLLATERAL_CONFIG_V1, RiskBand } from '@fondealo/types';
import { Navbar } from '@/components/navbar';
import { SectionTabs } from '@/components/section-tabs';
import { AddressLookupBanner } from '@/components/address-lookup-banner';
import { DataSourceBadge } from '@/components/data-source-badge';
import { PassportCard } from '@/components/passport-card';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { getBorrowerPassport } from '@/lib/data/opportunities';
import { FileCheck, Repeat, TrendingUp } from '@/components/icons';

const TABS = [
  { href: '/business', label: 'Dashboard' },
  { href: '/business/new', label: 'New request' },
  { href: '/business/passport', label: 'Passport' },
];

export const dynamic = 'force-dynamic';

export default async function BusinessPassportPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const { address: rawAddress } = await searchParams;
  const address = rawAddress ?? 'GBODEGA…LIMA';
  const { source, passport } = await getBorrowerPassport(address);

  return (
    <>
      <Navbar />
      <SectionTabs tabs={TABS} active="/business/passport" />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">Your reputation</h1>
              <p className="mt-1 text-slate-500">
                What raised your score, and exactly what lowers your next collateral requirement.
              </p>
            </div>
            <DataSourceBadge source={source} />
          </div>

          <div className="mb-6">
            <AddressLookupBanner address={rawAddress} action="/business/passport" placeholderLabel="passport" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <PassportCard passport={passport} />

            <div className="grid content-start gap-6">
              <ScoreBreakdown passport={passport} />

              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Score → collateral, band by band
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  This is the whole flywheel: repay on time → score rises → your band improves →
                  the next loan needs less locked capital. Nothing here is negotiable or
                  discretionary — it&apos;s the same table every business reads from.
                </p>
                <div className="divide-y divide-slate-100">
                  {Object.values(RiskBand).map((band) => {
                    const config = COLLATERAL_CONFIG_V1[band];
                    const isCurrent = band === passport.riskBand;
                    return (
                      <div
                        key={band}
                        className={`flex items-center justify-between py-3 ${isCurrent ? 'rounded-lg bg-brand-50/60 px-3' : 'px-3'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold ${
                              isCurrent
                                ? 'bg-brand-600 text-white'
                                : 'border border-slate-200 bg-white text-slate-500'
                            }`}
                          >
                            {band}
                          </span>
                          <span className="text-sm text-slate-600">
                            {isCurrent ? 'Your current band' : `Band ${band}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-800">
                            {config.collateralRatioBps / 100}% collateral
                          </div>
                          <div className="text-xs text-slate-400">
                            ~{(config.suggestedAprBps / 100).toFixed(1)}% APR
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Reputation journey</h2>
                <ol className="space-y-4">
                  {[
                    {
                      icon: FileCheck,
                      t: 'KYB accepted · Passport issued',
                      s: 'Score started at 500 (band C)',
                    },
                    {
                      icon: TrendingUp,
                      t: `${passport.loansRepaid} of ${passport.loansTotal} loans repaid on time`,
                      s: `Current streak: ${passport.onTimeStreak}`,
                    },
                    {
                      icon: Repeat,
                      t: 'Next loan',
                      s: 'Every on-time, investor-funded repayment compounds — see the breakdown above.',
                    },
                  ].map((e, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <e.icon width={16} height={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-slate-800">{e.t}</span>
                        <span className="block text-xs text-slate-500">{e.s}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
