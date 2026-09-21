'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  KybStatus,
  PassportStatus,
  SCORE_MAX,
  passportHistoryMonths,
  type Passport,
  type RiskBand,
} from '@fondealo/types';
import { DEFAULT_PASSPORT_THEME, themeStyleVars, type PassportTheme } from '@/lib/passport-theme';
import { ScoreRing } from './score-ring';
import { Check, ShieldCheck, Sparkle } from './icons';

/**
 * Business Passport — the product's signature object, built in two layers:
 *
 * - **Identity layer** (top): who the business is and how it looks. The owner
 *   chooses the colours and pattern; the name comes from KYB.
 * - **Trust layer** (bottom): what Fondealo attests — KYB status, credit score,
 *   risk band, repayment history, on-chain verification. Fixed styling, never
 *   themed, so no colour choice can make a weak business look strong.
 *
 * Effects are hand-rolled — pointer-tracked 3D tilt, a mount reveal, a
 * holographic sheen, a score count-up, colour transitions via registered CSS
 * properties — so the passport adds zero runtime dependencies. All of it
 * degrades to a clean static card under `prefers-reduced-motion` and on touch.
 */

const BAND_META: Record<RiskBand, { label: string; from: string; to: string }> = {
  A: { label: 'Prime', from: '#6ee7b7', to: '#059669' },
  B: { label: 'Strong', from: '#34d399', to: '#047857' },
  C: { label: 'Building', from: '#fcd34d', to: '#d97706' },
  D: { label: 'Watch', from: '#fdba74', to: '#ea580c' },
  E: { label: 'High risk', from: '#fca5a5', to: '#dc2626' },
};

export interface PassportV2Props {
  passport: Passport;
  /** `showcase` floats and never shows the log-out affordances; `full` is the dashboard credential. */
  variant?: 'full' | 'showcase';
  /** Business identity line (legal name + place). Omitted when the name isn't known. */
  holder?: { name: string; place: string };
  /** Identity-layer look chosen by the owner. Defaults to Emerald. */
  theme?: PassportTheme;
  /** Overrides the default stat trio (Repaid · Streak · History). */
  stats?: { k: string; v: string }[];
  /** Optional "Credit signals" rows shown under the stats (used by the landing demo). */
  signals?: { k: string; v: string }[];
  /** When set, "View on-chain" links to this explorer page. */
  explorerUrl?: string;
  className?: string;
}

export function PassportV2({
  passport,
  variant = 'full',
  holder,
  theme = DEFAULT_PASSPORT_THEME,
  stats,
  signals,
  explorerUrl,
  className,
}: PassportV2Props) {
  const band = BAND_META[passport.riskBand];
  const status = passport.status ?? PassportStatus.Active;
  const verified = passport.kybStatus === KybStatus.Accepted && status === PassportStatus.Active;
  const statList = stats ?? [
    { k: 'Repaid', v: `${passport.loansRepaid}/${passport.loansTotal}` },
    { k: 'Streak', v: String(passport.onTimeStreak) },
    { k: 'History', v: `${passportHistoryMonths(passport)} mo` },
  ];

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 0 });
  const displayScore = useCountUp(passport.score);
  const themeKey = `${theme.preset}:${theme.accent ?? ''}:${theme.pattern}`;

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch') return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 8,
      ry: (px - 0.5) * 10,
      gx: px * 100,
      gy: py * 100,
    });
  }
  function handleLeave() {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 0 });
  }

  const style = {
    ...themeStyleVars(theme),
    '--rx': `${tilt.rx}deg`,
    '--ry': `${tilt.ry}deg`,
    '--gx': `${tilt.gx}%`,
    '--gy': `${tilt.gy}%`,
    '--band-from': band.from,
    '--band-to': band.to,
  } as CSSProperties;

  return (
    <div
      className={[
        'fdo-passport',
        variant === 'showcase' ? 'fdo-passport--showcase' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div
        ref={cardRef}
        className="fdo-passport__card"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        <div className="fdo-passport__rim" aria-hidden />
        <div className="fdo-passport__sheen" aria-hidden />

        <div className="fdo-passport__body">
          {/* ============ IDENTITY LAYER — the owner's look ============ */}
          <section
            key={themeKey}
            aria-label="Business identity"
            className={`fdo-id fdo-id--${theme.pattern} fdo-id__pulse`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-display text-[12px] font-bold uppercase tracking-[0.24em] text-white">
                <Sparkle width={12} height={12} style={{ color: 'var(--t-a)' }} />
                Fondealo
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Stellar
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: 'var(--t-a)', boxShadow: '0 0 8px var(--t-a)' }}
                  aria-hidden
                />
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="fdo-id__name text-[1.45rem] leading-tight text-white">
                {holder?.name ?? shortAddr(passport.business)}
              </div>
              <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.42em] text-white/60">
                Business Passport
              </div>
              {holder?.place ? (
                <div className="mt-2 text-[11px] text-white/55">{holder.place}</div>
              ) : null}
            </div>
          </section>

          {/* ============ TRUST LAYER — fixed, verified by Fondealo ============ */}
          <section aria-label="Verified credit standing" className="fdo-trust">
            <div className="flex items-center justify-between">
              <StatusPill kyb={passport.kybStatus} status={status} verified={verified} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">
                Set by Fondealo
              </span>
            </div>

            <div className="relative -mb-3 mt-3 grid place-items-center">
              <ScoreRing score={passport.score} band={passport.riskBand} size={176} label={false} />
              <div className="pointer-events-none absolute flex flex-col items-center">
                <span className="font-display text-[2.6rem] font-bold leading-none tabular-nums text-white">
                  {displayScore}
                </span>
                <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.24em] text-white/45">
                  Credit / {SCORE_MAX}
                </span>
                <RiskBadge band={passport.riskBand} label={band.label} />
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-center">
              {statList.map((st, i) => (
                <Stat key={st.k} k={st.k} v={st.v} border={i === 1} />
              ))}
            </dl>

            {signals?.length ? (
              <div className="mt-4">
                <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/35">
                  Credit signals
                </div>
                <ul className="mt-2 space-y-1.5">
                  {signals.map((sig) => (
                    <li key={sig.k} className="flex items-center gap-2 text-[12px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
                      <span className="flex-1 text-white/65">{sig.k}</span>
                      <span className="font-display font-semibold text-white">{sig.v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                <span className="fdo-passport__seal">
                  <Check width={11} height={11} />
                </span>
                Verified on-chain
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[10.5px] tracking-wide text-white/55">
                  {passport.passportId !== undefined
                    ? `#${passport.passportId}`
                    : shortAddr(passport.business)}
                </span>
                {explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-semibold uppercase tracking-wider text-white/60 transition-colors hover:text-white"
                  >
                    View ↗
                  </a>
                ) : null}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- pieces ------------------------------- */

function StatusPill({
  kyb,
  status,
  verified,
}: {
  kyb: string;
  status: PassportStatus;
  verified: boolean;
}) {
  if (status !== PassportStatus.Active) {
    const revoked = status === PassportStatus.Revoked;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
          revoked
            ? 'border-red-400/40 bg-red-400/10 text-red-200'
            : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
        }`}
      >
        {revoked ? 'Revoked' : 'Frozen'}
      </span>
    );
  }
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
        verified
          ? 'border-brand-400/40 bg-brand-400/10 text-brand-200'
          : 'border-white/15 bg-white/5 text-white/60',
      ].join(' ')}
    >
      {verified ? <ShieldCheck width={12} height={12} /> : null}
      {verified ? 'KYB verified' : `KYB ${kyb}`}
    </span>
  );
}

function RiskBadge({ band, label }: { band: RiskBand; label: string }) {
  return (
    <span className="fdo-riskbadge mt-2.5">
      <span className="fdo-riskbadge__grade">{band}</span>
      <span className="fdo-riskbadge__label">{label}</span>
    </span>
  );
}

function Stat({ k, v, border = false }: { k: string; v: string; border?: boolean }) {
  return (
    <div className={`py-2.5 ${border ? 'border-x border-white/10' : ''}`}>
      <dt className="text-[9px] uppercase tracking-[0.18em] text-white/40">{k}</dt>
      <dd className="mt-0.5 font-display text-[13px] font-semibold text-white">{v}</dd>
    </div>
  );
}

/* ------------------------------- utils ------------------------------- */

function shortAddr(a: string): string {
  if (a.length <= 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-6)}`;
}

/**
 * Counts from 0 up to `value` once on mount. First render returns `value` on
 * both server and client (no hydration mismatch); the animation only kicks in
 * client-side, and is skipped entirely under reduced-motion.
 */
function useCountUp(value: number): number {
  const [n, setN] = useState(value);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value);
      return;
    }
    let raf = 0;
    let t0 = 0;
    const dur = 900;
    // The reset to 0 happens *inside* the first frame — if rAF is throttled
    // and never fires, `n` simply stays at the correct final value.
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return n;
}
