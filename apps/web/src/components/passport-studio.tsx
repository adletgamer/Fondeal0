'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button, Card } from '@fondealo/ui';
import type { Passport } from '@fondealo/types';
import { savePassportTheme, type ThemeResult } from '@/lib/actions/passport-theme';
import {
  DEFAULT_PASSPORT_THEME,
  PASSPORT_PATTERNS,
  PASSPORT_PRESETS,
  isHexColor,
  swatchGradient,
  type PassportPattern,
  type PassportPresetId,
  type PassportTheme,
} from '@/lib/passport-theme';
import { PassportV2 } from './passport-v2';
import { Lock } from './icons';

const PATTERN_LABEL: Record<PassportPattern, string> = {
  lines: 'Lines',
  dots: 'Dots',
  none: 'Clean',
};

const initialState: ThemeResult | null = null;

/**
 * Passport + a live customizer. The owner restyles the *identity layer* only —
 * colours and pattern — and sees the change instantly (colours animate). What
 * the trust layer says (score, KYB, repayments) is not editable here or anywhere.
 */
export function PassportStudio({
  passport,
  holder,
  explorerUrl,
  initialTheme,
}: {
  passport: Passport;
  holder?: { name: string; place: string };
  explorerUrl?: string;
  initialTheme: PassportTheme;
}) {
  const [state, formAction, pending] = useActionState(savePassportTheme, initialState);
  const [theme, setTheme] = useState<PassportTheme>(initialTheme);
  const [saved, setSaved] = useState<PassportTheme>(initialTheme);

  useEffect(() => {
    if (state?.ok) setSaved(state.theme);
  }, [state]);

  const dirty =
    theme.preset !== saved.preset ||
    theme.pattern !== saved.pattern ||
    (theme.preset === 'custom' && theme.accent !== saved.accent);
  const customInvalid = theme.preset === 'custom' && !isHexColor(theme.accent);

  function pickPreset(id: PassportPresetId) {
    setTheme((t) => ({
      ...t,
      preset: id,
      // Seed the custom colour so the swatch shows something sensible immediately.
      accent: id === 'custom' ? (t.accent ?? '#22d3ee') : null,
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <PassportV2
        passport={passport}
        holder={holder}
        explorerUrl={explorerUrl}
        theme={customInvalid ? saved : theme}
        className="mx-auto lg:mx-0"
      />

      <Card className="h-fit p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Make it yours</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose how your Passport looks. Changes preview instantly; save to publish them to
              lenders who view your profile.
            </p>
          </div>
        </div>

        <form action={formAction} className="mt-5 space-y-5">
          <input type="hidden" name="preset" value={theme.preset} />
          <input type="hidden" name="accent" value={theme.accent ?? ''} />
          <input type="hidden" name="pattern" value={theme.pattern} />

          <fieldset>
            <legend className="text-xs font-medium text-slate-600">Colour theme</legend>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[
                ...PASSPORT_PRESETS.map((p) => ({ id: p.id as PassportPresetId, label: p.label })),
                { id: 'custom' as PassportPresetId, label: 'Custom' },
              ].map((p) => {
                const selected = theme.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => pickPreset(p.id)}
                    className={[
                      'group flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60',
                      selected
                        ? 'border-slate-900 bg-slate-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <span
                      className={`h-9 w-9 rounded-full ring-2 ring-offset-2 transition-transform group-hover:scale-105 ${
                        selected ? 'ring-slate-900' : 'ring-transparent'
                      }`}
                      style={{ background: swatchGradient(p.id, theme.accent) }}
                    />
                    <span className="text-[11px] font-medium leading-tight text-slate-700">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {theme.preset === 'custom' ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="color"
                aria-label="Pick a custom accent colour"
                value={isHexColor(theme.accent) ? theme.accent : '#22d3ee'}
                onChange={(e) => setTheme((t) => ({ ...t, accent: e.target.value.toLowerCase() }))}
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
              />
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600" htmlFor="accent-hex">
                  Accent colour
                </label>
                <input
                  id="accent-hex"
                  value={theme.accent ?? ''}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setTheme((t) => ({ ...t, accent: v.startsWith('#') ? v : `#${v}` }));
                  }}
                  maxLength={7}
                  placeholder="#22d3ee"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>
          ) : null}

          <fieldset>
            <legend className="text-xs font-medium text-slate-600">Pattern</legend>
            <div className="mt-2 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {PASSPORT_PATTERNS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={theme.pattern === p}
                  onClick={() => setTheme((t) => ({ ...t, pattern: p }))}
                  className={[
                    'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60',
                    theme.pattern === p
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  {PATTERN_LABEL[p]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending || !dirty || customInvalid}>
              {pending ? 'Saving…' : 'Save look'}
            </Button>
            <button
              type="button"
              onClick={() => setTheme(DEFAULT_PASSPORT_THEME)}
              className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              Reset to default
            </button>
            {customInvalid ? (
              <span className="text-xs text-red-600">Enter a valid colour like #22d3ee.</span>
            ) : null}
            {state && !state.ok ? (
              <span className="text-xs text-red-600">{state.error}</span>
            ) : null}
            {state && state.ok && !dirty ? (
              <span className="text-xs text-brand-600">{state.message}</span>
            ) : null}
          </div>
        </form>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
            <Lock width={14} height={14} />
          </span>
          <p className="text-sm text-slate-600">
            <strong className="text-slate-900">Style, not substance.</strong> The top of the card is
            yours. The bottom — KYB status, credit score, risk band and repayment history — is set
            by Fondealo and the on-chain record, so colours can never change how your credit reads.
          </p>
        </div>
      </Card>
    </div>
  );
}
