import { Badge, Button, Card, Container } from '@fondealo/ui';
import { KybStatus, RiskBand, type Passport } from '@fondealo/types';
import { Navbar } from '@/components/navbar';
import { PassportCard } from '@/components/passport-card';
import { Coins, FileCheck, Repeat, TrendingUp } from '@/components/icons';

// Placeholder data for the shell. Wired to the on-chain PassportClient in Phase 4.
const demoPassport: Passport = {
  business: 'GBODEGA…LIMA',
  kybStatus: KybStatus.Accepted,
  score: 640,
  riskBand: RiskBand.C,
  loansTotal: 3,
  loansRepaid: 3,
  onTimeStreak: 3,
  issuedAt: 1_760_000_000,
  updatedAt: 1_766_000_000,
  dataHash: '0x…',
};

export default function BusinessDashboard() {
  return (
    <>
      <Navbar />
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">Business dashboard</h1>
              <p className="mt-1 text-slate-500">
                Your Passport, financing, and reputation — in one place.
              </p>
            </div>
            <Badge variant="gold">Demo data · wired in Phase 6</Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <PassportCard passport={demoPassport} />

            <div className="grid content-start gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-slate-900">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
                    <Coins width={20} height={20} />
                  </span>
                  <h2 className="text-lg font-semibold">Request financing</h2>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Create a funding opportunity in USDC. Your risk band{' '}
                  <strong className="text-slate-700">{demoPassport.riskBand}</strong> suggests the
                  APR. Investors fund it, and repayments build your score.
                </p>
                <Button className="mt-5" disabled>
                  Create opportunity
                </Button>
                <span className="ml-3 text-xs text-slate-400">
                  Coming in Phase 6 — Funding Flow
                </span>
              </Card>

              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Reputation journey</h2>
                <ol className="space-y-4">
                  {[
                    {
                      icon: FileCheck,
                      t: 'KYB accepted · Passport issued',
                      s: 'Score started at 500',
                    },
                    { icon: TrendingUp, t: 'Loan #1–#3 repaid on time', s: '+140 · streak 3' },
                    { icon: Repeat, t: 'Next loan', s: 'Lower risk band → cheaper capital' },
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
