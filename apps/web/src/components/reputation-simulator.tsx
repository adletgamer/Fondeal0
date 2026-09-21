'use client';

import { useMemo, useState } from 'react';
import {
  COLLATERAL_CONFIG_V1,
  SCORE_MAX,
  bandForScore,
  previewOnTimeGain,
  requiredCollateral,
  type RiskBand,
} from '@fondealo/types';

/**
 * "What does repaying do?" — an interactive run of the real score rules. It
 * starts a new business at 500 and applies `previewOnTimeGain` (the same
 * formula the `credit_score` contract runs, see docs/score-spec.md) once per
 * on-time, investor-funded repayment, then reads the resulting band from
 * `bandForScore` and the collateral from `COLLATERAL_CONFIG_V1`. Nothing here
 * is invented copy: drag the slider and you are reading the rulebook.
 */
const START_SCORE = 500;
const LOAN_USDC = 5_000;
const MAX_REPAYMENTS = 12;

const BAND_COLOR: Record<RiskBand, string> = {
  A: '#34d399',
  B: '#6ee7b7',
  C: '#fcd34d',
  D: '#fdba74',
  E: '#fca5a5',
};

function trajectory(): number[] {
  const scores = [START_SCORE];
  for (let i = 0; i < MAX_REPAYMENTS; i++) {
    const cur = scores[i]!;
    scores.push(Math.min(SCORE_MAX, cur + previewOnTimeGain(cur, i)));
  }
  return scores;
}

export function ReputationSimulator() {
  const [repayments, setRepayments] = useState(6);
  const scores = useMemo(trajectory, []);

  const score = scores[repayments]!;
  const band = bandForScore(score);
  const config = COLLATERAL_CONFIG_V1[band];
  const collateral = Number(requiredCollateral(String(LOAN_USDC), band));
  const startCollateral = Number(requiredCollateral(String(LOAN_USDC), bandForScore(START_SCORE)));
  const saved = startCollateral - collateral;

  const r = 84;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const offset = arc * (1 - score / SCORE_MAX);

  return (
    <div className="rounded-3xl border border-white/10 bg-night-900 p-6 text-white shadow-soft sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-300">
            Reputation simulator
          </div>
          <div className="mt-1 text-sm text-slate-400">New business · starts at {START_SCORE}</div>
        </div>
        <div className="text-right text-xs text-slate-400">
          Loan of{' '}
          <span className="font-semibold text-white">{LOAN_USDC.toLocaleString('en-US')} USDC</span>
        </div>
      </div>

      <div className="mt-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="relative mx-auto h-[200px] w-[200px]">
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full"
            style={{ transform: 'rotate(135deg)' }}
          >
            <circle
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circ}`}
            />
            <circle
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={BAND_COLOR[band]}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circ}`}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1), stroke 0.4s',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl font-bold tabular-nums">{score}</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
              Band {band}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <dt className="text-xs text-slate-400">Collateral required</dt>
            <dd className="mt-1 font-display text-3xl font-bold tabular-nums">
              {collateral.toLocaleString('en-US')}
              <span className="ml-1 text-sm font-medium text-slate-400">USDC</span>
            </dd>
            <dd className="mt-0.5 text-xs text-slate-500">
              {config.collateralRatioBps / 100}% of the loan
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Suggested APR</dt>
            <dd className="mt-1 font-display text-3xl font-bold tabular-nums">
              {(config.suggestedAprBps / 100).toFixed(1)}
              <span className="ml-1 text-sm font-medium text-slate-400">%</span>
            </dd>
            <dd className="mt-0.5 text-xs text-slate-500">set by the risk band</dd>
          </div>
          <div className="col-span-2 rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-slate-300">
            {repayments === 0 ? (
              <>Drag the slider to repay on time and watch the collateral fall.</>
            ) : saved > 0 ? (
              <>
                After {repayments} on-time {repayments === 1 ? 'repayment' : 'repayments'} you lock{' '}
                <strong className="text-brand-300">
                  {saved.toLocaleString('en-US')} USDC less
                </strong>{' '}
                than a brand-new business.
              </>
            ) : (
              <>
                {repayments} {repayments === 1 ? 'repayment' : 'repayments'} in — the band
                hasn&apos;t moved yet, but every on-time payment compounds.
              </>
            )}
          </div>
        </dl>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="repayments" className="font-medium text-slate-300">
            On-time repayments completed
          </label>
          <span className="font-display text-lg font-bold tabular-nums">{repayments}</span>
        </div>
        <input
          id="repayments"
          type="range"
          min={0}
          max={MAX_REPAYMENTS}
          value={repayments}
          onChange={(e) => setRepayments(Number(e.target.value))}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
          aria-valuetext={`${repayments} repayments, score ${score}, band ${band}`}
        />
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
          <span>0</span>
          <span>{MAX_REPAYMENTS}</span>
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Uses the same formula as the score contract: each on-time, investor-funded repayment adds
        points with a streak bonus, shrinking toward the {SCORE_MAX} cap. Self-funded round-trips
        add nothing.
      </p>
    </div>
  );
}
