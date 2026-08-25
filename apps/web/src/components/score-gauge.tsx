import { SCORE_MAX, type RiskBand } from '@fondealo/types';

const BAND_COLOR: Record<RiskBand, string> = {
  A: '#10b981',
  B: '#34d399',
  C: '#f59e0b',
  D: '#f97316',
  E: '#ef4444',
};

/** Circular score gauge (0..SCORE_MAX) with band-colored arc. Pure SVG. */
export function ScoreGauge({
  score,
  band,
  size = 168,
}: {
  score: number;
  band: RiskBand;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / SCORE_MAX));
  const color = BAND_COLOR[band];

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl font-bold tabular-nums text-slate-900">{score}</span>
        <span className="text-xs text-slate-400">/ {SCORE_MAX}</span>
        <span
          className="mt-1 rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          Risk {band}
        </span>
      </div>
    </div>
  );
}
