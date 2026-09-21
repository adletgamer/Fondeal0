import { SCORE_MAX, type RiskBand } from '@fondealo/types';

/**
 * Premium score dial for the Business Passport: a 270° gradient arc with a
 * soft outer glow, tick marks, and a draw-in animation on mount (pure CSS —
 * the keyframe reads `--c`/`--target` set inline, so this stays a Server
 * Component). Distinct from the flat `ScoreGauge` used in list contexts.
 */
const BAND_STOPS: Record<RiskBand, [string, string]> = {
  A: ['#6ee7b7', '#10b981'],
  B: ['#34d399', '#059669'],
  C: ['#fcd34d', '#f59e0b'],
  D: ['#fdba74', '#f97316'],
  E: ['#fca5a5', '#ef4444'],
};

export function ScoreRing({
  score,
  band,
  size = 208,
  label = true,
}: {
  score: number;
  band: RiskBand;
  size?: number;
  label?: boolean;
}) {
  // Round every derived number to a fixed precision: server and client both
  // serialise these into SVG attributes, and raw Math.cos/sin results differ
  // in their last float digit between the two, which React flags as a
  // hydration mismatch.
  const q = (n: number) => Math.round(n * 100) / 100;

  const stroke = 14;
  const r = (size - stroke) / 2 - 6;
  const circ = q(2 * Math.PI * r);
  const sweep = 0.75; // 270° visible arc
  const pct = Math.max(0, Math.min(1, score / SCORE_MAX));
  const arcLen = q(circ * sweep);
  const target = q(arcLen * (1 - pct));
  const [from, to] = BAND_STOPS[band];
  const gid = `ring-${band}`;
  const ticks = Array.from({ length: 28 }, (_, i) => i);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(135deg)' }}
      >
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <filter id={`${gid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* tick ring */}
        <g stroke="rgba(255,255,255,0.14)" strokeWidth="1.5">
          {ticks.map((i) => {
            const a = (i / (ticks.length - 1)) * sweep * 2 * Math.PI;
            return (
              <line
                key={i}
                x1={q(size / 2 + Math.cos(a) * (r + 10))}
                y1={q(size / 2 + Math.sin(a) * (r + 10))}
                x2={q(size / 2 + Math.cos(a) * (r + 15))}
                y2={q(size / 2 + Math.sin(a) * (r + 15))}
              />
            );
          })}
        </g>

        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`}
        />

        {/* value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`}
          filter={`url(#${gid}-glow)`}
          className="fdo-ring-arc"
          style={
            {
              '--c': `${arcLen}`,
              strokeDashoffset: target,
            } as React.CSSProperties
          }
        />
      </svg>

      {label ? (
        <div className="absolute flex flex-col items-center">
          <span className="font-display text-[2.6rem] font-bold leading-none tabular-nums text-white">
            {score}
          </span>
          <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            / {SCORE_MAX}
          </span>
        </div>
      ) : null}
    </div>
  );
}
