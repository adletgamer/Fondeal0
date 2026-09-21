'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  passportHistoryMonths,
  reputationLayers,
  type Passport,
  type ReputationLayerId,
} from '@fondealo/types';

/**
 * Credit Reputation Ring — the score as a visual object instead of a number.
 * Four concentric 270° arcs (Identity, Repayment, Activity, Longevity), each
 * filled to its own 0–100 value, drawn in with a staggered CSS animation.
 * Hovering or focusing a row in the legend spotlights its ring and swaps the
 * centre to that layer's value.
 *
 * The layers are views over real Passport fields (see `reputationLayers` in
 * @fondealo/types), not extra on-chain score components.
 */
const LAYER_META: Record<ReputationLayerId, { label: string; color: string }> = {
  identity: { label: 'Identity', color: '#34d399' },
  repayment: { label: 'Repayment', color: '#22d3ee' },
  activity: { label: 'Activity', color: '#fbbf24' },
  longevity: { label: 'Longevity', color: '#a78bfa' },
};

function layerDetail(id: ReputationLayerId, p: Passport): string {
  switch (id) {
    case 'identity':
      return `KYB ${p.kybStatus}`;
    case 'repayment':
      return `${p.loansRepaid}/${p.loansTotal} repaid`;
    case 'activity':
      return `${p.loansTotal} ${p.loansTotal === 1 ? 'loan' : 'loans'}`;
    case 'longevity':
      return `${passportHistoryMonths(p)} mo history`;
  }
}

export function ReputationRing({
  passport,
  size = 200,
  center,
  legend = true,
}: {
  passport: Passport;
  size?: number;
  /** Shown in the middle while no layer is spotlighted (defaults to the score). */
  center?: ReactNode;
  legend?: boolean;
}) {
  const [active, setActive] = useState<ReputationLayerId | null>(null);
  const layers = reputationLayers(passport);

  // Fixed precision: server and client serialise these into SVG attributes and
  // raw float results differ in the last digit, which React flags on hydration.
  const q = (n: number) => Math.round(n * 100) / 100;
  const stroke = 9;
  const gap = 14;
  const sweep = 0.75;
  const outer = size / 2 - stroke;
  const activeLayer = layers.find((l) => l.id === active);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative inline-grid place-items-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(135deg)' }}
          role="img"
          aria-label={`Credit reputation: ${layers.map((l) => `${LAYER_META[l.id].label} ${l.value}%`).join(', ')}`}
        >
          {layers.map((layer, i) => {
            const r = outer - i * gap;
            const circ = q(2 * Math.PI * r);
            const arcLen = q(circ * sweep);
            const dim = active !== null && active !== layer.id;
            const { color } = LAYER_META[layer.id];
            return (
              <g key={layer.id} style={{ opacity: dim ? 0.22 : 1, transition: 'opacity 200ms' }}>
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
                {layer.value > 0 ? (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${arcLen} ${circ}`}
                    className="fdo-ring-arc"
                    style={
                      {
                        '--c': `${arcLen}`,
                        strokeDashoffset: q(arcLen * (1 - layer.value / 100)),
                        animationDelay: `${i * 140}ms`,
                        filter: active === layer.id ? `drop-shadow(0 0 6px ${color})` : undefined,
                      } as CSSProperties
                    }
                  />
                ) : null}
              </g>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute flex flex-col items-center text-center">
          {activeLayer ? (
            <>
              <span
                className="font-display text-[2.4rem] font-bold leading-none tabular-nums"
                style={{ color: LAYER_META[activeLayer.id].color }}
              >
                {activeLayer.value}
                <span className="text-lg">%</span>
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
                {LAYER_META[activeLayer.id].label}
              </span>
            </>
          ) : (
            (center ?? (
              <span className="font-display text-[2.6rem] font-bold leading-none tabular-nums text-white">
                {passport.score}
              </span>
            ))
          )}
        </div>
      </div>

      {legend ? (
        <ul className="mt-4 w-full space-y-1.5" onMouseLeave={() => setActive(null)}>
          <li className="px-1.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/35">
            Credit signals
          </li>
          {layers.map((layer) => {
            const { label, color } = LAYER_META[layer.id];
            return (
              <li key={layer.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none"
                  onMouseEnter={() => setActive(layer.id)}
                  onFocus={() => setActive(layer.id)}
                  onBlur={() => setActive(null)}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                    aria-hidden
                  />
                  <span className="w-[68px] shrink-0 text-[11px] font-semibold text-white/85">
                    {label}
                  </span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${layer.value}%`, background: color }}
                    />
                  </span>
                  <span className="w-[86px] shrink-0 text-right text-[10px] text-white/50">
                    {layerDetail(layer.id, passport)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
