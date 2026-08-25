import { Card } from '@fondealo/ui';
import { type Passport } from '@fondealo/types';
import { ScoreGauge } from './score-gauge';
import { ShieldCheck } from './icons';

/** Renders a Business Passport summary. Data comes from the on-chain read once wired. */
export function PassportCard({ passport }: { passport: Passport }) {
  const stats = [
    { label: 'KYB', value: passport.kybStatus },
    { label: 'Repaid', value: `${passport.loansRepaid}/${passport.loansTotal}` },
    { label: 'On-time streak', value: String(passport.onTimeStreak) },
  ];
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <ShieldCheck width={18} height={18} className="text-brand-600" />
          Business Passport
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          {passport.kybStatus}
        </span>
      </div>
      <div className="grid place-items-center py-6">
        <ScoreGauge score={passport.score} band={passport.riskBand} size={180} />
      </div>
      <dl className="grid grid-cols-3 border-t border-slate-100 text-center">
        {stats.map((s) => (
          <div key={s.label} className="border-r border-slate-100 py-4 last:border-r-0">
            <dt className="text-xs uppercase tracking-wide text-slate-400">{s.label}</dt>
            <dd className="mt-1 font-display text-sm font-semibold text-slate-900">{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
        <span className="font-mono">{passport.business}</span>
        <span className="text-brand-600">portable across loans</span>
      </div>
    </Card>
  );
}
