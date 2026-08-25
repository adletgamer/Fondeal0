import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@fondealo/ui';
import { KybStatus, RiskBand, type Passport } from '@fondealo/types';
import { PassportCard } from '@/components/passport-card';

// Placeholder data for the shell. Wired to the on-chain PassportClient in Phase 4.
const demoPassport: Passport = {
  business: 'GBUSINESS…DEMO',
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
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Business dashboard</h1>
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← Home
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PassportCard passport={demoPassport} />
        <Card>
          <CardHeader>
            <CardTitle>Request financing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Create a funding opportunity in USDC. Your risk band suggests the APR. (Coming in
              Phase 6 — Funding Flow.)
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
