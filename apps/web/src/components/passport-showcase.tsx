'use client';

import { useState } from 'react';
import {
  DEFAULT_PASSPORT_THEME,
  PASSPORT_PRESETS,
  isHexColor,
  swatchGradient,
  type PassportPresetId,
  type PassportTheme,
} from '@/lib/passport-theme';
import { SHOWCASE_PASSPORT } from '@/lib/showcase';
import { PassportV2 } from './passport-v2';

/**
 * The landing's Passport, restylable by the visitor: the picker below only
 * changes the identity layer (top of the card) — the score, KYB and repayments
 * stay put, which is exactly the promise of the two-layer design.
 */
export function PassportShowcase() {
  const [theme, setTheme] = useState<PassportTheme>(DEFAULT_PASSPORT_THEME);
  const custom = theme.preset === 'custom';

  function pick(id: PassportPresetId) {
    setTheme((t) => ({
      ...t,
      preset: id,
      accent: id === 'custom' ? (t.accent ?? '#38bdf8') : null,
    }));
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <PassportV2
        passport={SHOWCASE_PASSPORT}
        variant="showcase"
        theme={theme}
        holder={{ name: 'Café Andino SAC', place: 'Peru · Retail' }}
        stats={[
          { k: 'Repaid', v: '8 / 8' },
          { k: 'On-time', v: '94%' },
          { k: 'History', v: '14 mo' },
        ]}
        signals={[
          { k: 'Payments', v: '+32' },
          { k: 'KYB', v: 'Verified' },
          { k: 'Repayment', v: '+18' },
        ]}
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Try a look
        </span>
        <div className="flex items-center gap-2" role="group" aria-label="Passport colour theme">
          {PASSPORT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-label={p.label}
              aria-pressed={theme.preset === p.id}
              onClick={() => pick(p.id)}
              className={[
                'h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-night-950 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-white',
                theme.preset === p.id ? 'ring-white' : 'ring-transparent',
              ].join(' ')}
              style={{ background: swatchGradient(p.id) }}
            />
          ))}
          <label
            className={[
              'relative grid h-6 w-6 cursor-pointer place-items-center overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-night-950 transition-transform hover:scale-110 focus-within:ring-white',
              custom ? 'ring-white' : 'ring-transparent',
            ].join(' ')}
            style={{
              background: custom
                ? swatchGradient('custom', theme.accent)
                : 'conic-gradient(#f43f5e, #f59e0b, #10b981, #06b6d4, #8b5cf6, #f43f5e)',
            }}
          >
            <span className="sr-only">Custom colour</span>
            <input
              type="color"
              value={isHexColor(theme.accent) ? theme.accent : '#38bdf8'}
              onChange={(e) =>
                setTheme((t) => ({ ...t, preset: 'custom', accent: e.target.value.toLowerCase() }))
              }
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
