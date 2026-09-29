import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type RiskBandLetter = 'A' | 'B' | 'C' | 'D' | 'E';

/** Fixed Fondealo risk language: never customised per business. */
export const RISK_BAND_LABEL: Record<RiskBandLetter, string> = {
  A: 'Prime',
  B: 'Strong',
  C: 'Building',
  D: 'Watch',
  E: 'High risk',
};

const BAND_FILL: Record<RiskBandLetter, string> = {
  A: 'bg-band-a',
  B: 'bg-band-b',
  C: 'bg-band-c',
  D: 'bg-band-d',
  E: 'bg-band-e',
};

export interface RiskBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  band: RiskBandLetter;
  /** Show only the grade letter (dense tables). The label stays for screen readers. */
  compact?: boolean;
}

/**
 * The risk band pill: grade letter + fixed label on the band's fill, in
 * on-band (night) ink — 10:1 or better on every band, in both themes.
 */
export function RiskBadge({ band, compact, className, ...props }: RiskBadgeProps) {
  const label = RISK_BAND_LABEL[band];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full py-1 pl-1 text-on-band shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]',
        compact ? 'pr-1' : 'pr-3',
        BAND_FILL[band],
        className,
      )}
      {...props}
    >
      <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-night-950/15 font-display text-[11px] font-bold leading-none">
        {band}
      </span>
      <span
        className={cn(
          'font-display text-[10px] font-bold uppercase leading-4 tracking-[0.12em]',
          compact && 'sr-only',
        )}
      >
        {label}
      </span>
    </span>
  );
}
