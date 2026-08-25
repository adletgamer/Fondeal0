import { Card, CardContent, CardHeader, CardTitle } from '@fondealo/ui';
import { SCORE_MAX, type Passport } from '@fondealo/types';

const bandColor: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-lime-100 text-lime-800',
  C: 'bg-amber-100 text-amber-800',
  D: 'bg-orange-100 text-orange-800',
  E: 'bg-red-100 text-red-800',
};

/** Renders a Business Passport summary. Data comes from the on-chain read once wired. */
export function PassportCard({ passport }: { passport: Passport }) {
  const pct = Math.round((passport.score / SCORE_MAX) * 100);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Passport</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900">{passport.score}</div>
            <div className="text-xs text-slate-500">Credit score / {SCORE_MAX}</div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${bandColor[passport.riskBand] ?? ''}`}
          >
            Risk {passport.riskBand}
          </span>
        </div>
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
        </div>
        <dl className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <dt className="text-slate-500">KYB</dt>
            <dd className="font-medium">{passport.kybStatus}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Repaid</dt>
            <dd className="font-medium">
              {passport.loansRepaid}/{passport.loansTotal}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">On-time streak</dt>
            <dd className="font-medium">{passport.onTimeStreak}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
