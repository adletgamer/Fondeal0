'use client';

import { useState, type CSSProperties } from 'react';
import {
  DEFAULT_PASSPORT_THEME,
  PASSPORT_PRESETS,
  swatchGradient,
  themeStyleVars,
  type PassportPresetId,
  type PassportTheme,
} from '@/lib/passport-theme';
import { Check, Lock, Sparkle } from './icons';

const LOCKED_ROWS = [
  { k: 'KYB', v: 'Verified' },
  { k: 'Credit score', v: '720 · Strong' },
  { k: 'Loans repaid', v: '8 / 8' },
];

/**
 * A stripped-down anatomy of the Passport for the landing: the top layer
 * reacts to the swatches, the bottom layer visibly does not. Showing the
 * asymmetry is the argument — you can restyle who you are, never what you owe.
 */
export function LayerExplainer() {
  const [theme, setTheme] = useState<PassportTheme>(DEFAULT_PASSPORT_THEME);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="fdo-theme space-y-3" style={themeStyleVars(theme) as CSSProperties}>
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em]">
          <span className="text-white/80">Identity layer</span>
          <span className="text-brand-300">You choose</span>
        </div>

        <div className={`fdo-id fdo-id--${theme.pattern}`}>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.24em] text-white">
            <span className="inline-flex items-center gap-1.5">
              <Sparkle width={12} height={12} style={{ color: 'var(--t-a)' }} />
              Fondealo
            </span>
            <span className="text-[9px] text-white/70">Stellar</span>
          </div>
          <div className="mt-7 text-center">
            <div className="fdo-id__name text-2xl text-white">Café Andino</div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.42em] text-white/60">
              Business Passport
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <span className="text-white/80">Trust layer</span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <Lock width={12} height={12} /> Set by Fondealo
          </span>
        </div>

        <div className="fdo-trust !mt-0">
          <ul className="divide-y divide-white/10">
            {LOCKED_ROWS.map((row) => (
              <li key={row.k} className="flex items-center justify-between py-2.5 text-sm">
                <span className="inline-flex items-center gap-2 text-white/70">
                  <Check width={13} height={13} className="text-brand-400" />
                  {row.k}
                </span>
                <span className="font-display font-semibold text-white">{row.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="mt-6 flex items-center justify-center gap-2.5"
        role="group"
        aria-label="Preview a colour theme"
      >
        {PASSPORT_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-label={p.label}
            aria-pressed={theme.preset === p.id}
            onClick={() =>
              setTheme((t) => ({ ...t, preset: p.id as PassportPresetId, accent: null }))
            }
            className={[
              'h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-night-950 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-white',
              theme.preset === p.id ? 'ring-white' : 'ring-transparent',
            ].join(' ')}
            style={{ background: swatchGradient(p.id) }}
          />
        ))}
      </div>
    </div>
  );
}
