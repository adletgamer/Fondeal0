import { Card } from '@fondealo/ui';
import {
  SCORE_DEFAULT_PENALTY,
  SCORE_LATE_PENALTY,
  previewOnTimeGain,
  type Passport,
} from '@fondealo/types';
import { ShieldCheck, TrendingUp, XCircle } from './icons';

/**
 * The score is a deterministic on-chain function, not a black box — this
 * shows the exact rule that moves it next, computed with the same formula
 * `credit_score::preview()` runs (see docs/score-spec.md). No fabricated
 * "underwriting factors": every number here is real and auditable.
 */
export function ScoreBreakdown({ passport }: { passport: Passport }) {
  const nextGain = previewOnTimeGain(passport.score, passport.onTimeStreak);

  const rows = [
    {
      icon: TrendingUp,
      label: 'Next on-time repayment (funded by an investor)',
      value: `+${nextGain}`,
      tone: 'text-brand-600',
    },
    {
      icon: XCircle,
      label: 'Late repayment',
      value: `−${SCORE_LATE_PENALTY}`,
      tone: 'text-orange-600',
    },
    {
      icon: XCircle,
      label: 'Default',
      value: `−${SCORE_DEFAULT_PENALTY}`,
      tone: 'text-red-600',
    },
    {
      icon: ShieldCheck,
      label: 'Self-funded round-trip (anti-gaming)',
      value: 'neutral',
      tone: 'text-slate-400',
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">How your score moves</h2>
      <p className="mt-1 text-xs text-slate-500">
        At your current score ({passport.score}) and streak ({passport.onTimeStreak}), the next
        on-time, investor-funded repayment adds{' '}
        <strong className="text-brand-600">+{nextGain} points</strong>. Gains shrink as you
        approach 1000; penalties are flat, so they bite hardest for high scorers.
      </p>
      <ul className="mt-4 divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500">
              <r.icon width={16} height={16} />
            </span>
            <span className="flex-1 text-sm text-slate-700">{r.label}</span>
            <span className={`font-display text-sm font-bold ${r.tone}`}>{r.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
