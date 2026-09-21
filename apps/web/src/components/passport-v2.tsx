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
  SCORE_MAX,
  passportHistoryMonths,
  type Passport,
  type RiskBand,
} from '@fondealo/types';
import { ReputationRing } from './reputation-ring';
import { Check, ShieldCheck, Sparkle } from './icons';

/**
 * Business Passport V2 — the product's signature object. Not a form: a
 * verifiable on-chain credential, styled after a metal charge card (Amex
 * Centurion / Visa Infinite) crossed with an identity credential (World ID,
 * Apple Wallet).
 *
 * Effects are hand-rolled — pointer-tracked 3D tilt, a mount reveal, a
 * holographic sheen sweep, a score count-up — so the passport adds **zero**
 * runtime dependencies (no Framer Motion / Aceternity / Magic UI). All of it
 * degrades to a clean static card under `prefers-reduced-motion` and on
 * touch devices.
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
  /** Overrides the default stat trio (Repaid · Streak · History). */
  stats?: { k: string; v: string }[];
  /** When set, "View on-chain" links to this explorer page. */
  explorerUrl?: string;
  className?: string;
}

export function PassportV2({
  passport,
  variant = 'full',
  holder,
  stats,
  explorerUrl,
  className,
}: PassportV2Props) {
  const band = BAND_META[passport.riskBand];
  const verified = passport.kybStatus === KybStatus.Accepted;
  const statList = stats ?? [
    { k: 'Repaid', v: `${passport.loansRepaid}/${passport.loansTotal}` },
    { k: 'Streak', v: String(passport.onTimeStreak) },
    { k: 'History', v: `${passportHistoryMonths(passport)} mo` },
  ];

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 0 });
  const displayScore = useCountUp(passport.score);

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch') return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 10,
      ry: (px - 0.5) * 12,
      gx: px * 100,
      gy: py * 100,
    });
  }
  function handleLeave() {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 0 });
  }

  const style = {
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
          {/* ---- header ---- */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-display text-[13px] font-bold uppercase tracking-[0.22em] text-white">
                <Sparkle width={13} height={13} className="text-brand-300" />
                Fondealo
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.34em] text-white/45">
                Business Passport
              </div>
            </div>
            <Contactless />
          </div>

          {/* ---- holder ---- */}
          {holder ? (
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.06] font-display text-sm font-bold text-brand-200">
                {holder.name.slice(0, 1)}
              </span>
              <div>
                <div className="font-display text-[15px] font-semibold leading-tight text-white">
                  {holder.name}
                </div>
                <div className="mt-0.5 text-[11px] text-white/50">{holder.place}</div>
              </div>
            </div>
          ) : null}

          {/* ---- chip + verification ---- */}
          <div className="mt-5 flex items-center justify-between">
            <Chip />
            <span
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur',
                verified
                  ? 'border-brand-400/40 bg-brand-400/10 text-brand-200'
                  : 'border-white/15 bg-white/5 text-white/60',
              ].join(' ')}
            >
              {verified ? <ShieldCheck width={12} height={12} /> : null}
              KYB {passport.kybStatus}
            </span>
          </div>

          {/* ---- credit reputation ring ---- */}
          <div className="mt-4">
            <ReputationRing
              passport={passport}
              size={196}
              center={
                <>
                  <span className="font-display text-[2.9rem] font-bold leading-none tabular-nums text-white">
                    {displayScore}
                  </span>
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.24em] text-white/40">
                    Credit score / {SCORE_MAX}
                  </span>
                  <RiskBadge band={passport.riskBand} label={band.label} />
                </>
              }
            />
          </div>

          {/* ---- stats ---- */}
          <dl className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-center">
            {statList.map((st, i) => (
              <Stat key={st.k} k={st.k} v={st.v} border={i === 1} />
            ))}
          </dl>

          {/* ---- footer ---- */}
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-wide text-white/55">
              {shortAddr(passport.business)}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
              <span className="fdo-passport__seal">
                <Check width={11} height={11} />
              </span>
              Stellar verified
            </span>
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-semibold uppercase tracking-wider text-white/60 transition-colors hover:text-white"
              >
                View on-chain ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- pieces ------------------------------- */

function RiskBadge({ band, label }: { band: RiskBand; label: string }) {
  return (
    <span className="fdo-riskbadge mt-3">
      <span className="fdo-riskbadge__grade">{band}</span>
      <span className="fdo-riskbadge__label">Risk band · {label}</span>
    </span>
  );
}

function Stat({ k, v, border = false }: { k: string; v: string; border?: boolean }) {
  return (
    <div className={`py-2.5 ${border ? 'border-x border-white/10' : ''}`}>
      <dt className="text-[9px] uppercase tracking-[0.18em] text-white/35">{k}</dt>
      <dd className="mt-0.5 font-display text-[13px] font-semibold text-white">{v}</dd>
    </div>
  );
}

function Chip() {
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="29"
        rx="5"
        fill="url(#chip-g)"
        stroke="rgba(255,255,255,0.25)"
      />
      <path
        d="M13 0v6M27 0v6M13 24v6M27 24v6M0 11h6M0 19h6M34 11h6M34 19h6M13 11h14v8H13z"
        stroke="rgba(11,17,32,0.55)"
        strokeWidth="1.4"
      />
      <defs>
        <linearGradient id="chip-g" x1="0" y1="0" x2="40" y2="30">
          <stop stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Contactless() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="text-white/45"
    >
      <path
        d="M8 6c3.5 2.4 3.5 9.6 0 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 3.5c5 3.4 5 13.6 0 17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M16 1c6.5 4.3 6.5 17.7 0 22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
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
