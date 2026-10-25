import type { ReactNode } from 'react';

/**
 * Landing pictograms: two-tone outline art drawn on a 64×64 grid (topic icons
 * on 24×24). Colour comes only from CSS: strokes follow `currentColor` (set
 * `text-brand-text` on a parent), the soft second tone and the single accent
 * use theme-token classes, so every icon flips with Day/Night automatically.
 */
export type PictoProps = { className?: string; size?: number };

type FrameProps = PictoProps & { grid: 24 | 64; children: ReactNode };

function Frame({ className, size, grid, children }: FrameProps) {
  const px = size ?? grid;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${grid} ${grid}`}
      width={px}
      height={px}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

// Token classes, kept in one place so the palette stays consistent.
const SOFT = 'fill-brand-soft';
const ACCENT = 'fill-brand-fill';
const PAPER = 'fill-surface-100';

/**
 * Motion is opt-in per user: the keyframes only run when the visitor has not
 * asked for reduced motion. Loops are long (≥8s) and low-amplitude.
 */
const ORBIT_CSS =
  '@media (prefers-reduced-motion: no-preference){.fdl-orbit{animation:fdl-orbit 14s linear infinite}}' +
  '@keyframes fdl-orbit{to{stroke-dashoffset:-45}}';
const TWINKLE_CSS =
  '@media (prefers-reduced-motion: no-preference){.fdl-twinkle{transform-box:fill-box;transform-origin:center;animation:fdl-twinkle 9s ease-in-out infinite}}' +
  '@keyframes fdl-twinkle{0%,70%,100%{opacity:1;transform:scale(1)}80%{opacity:.35;transform:scale(.6)}}';

/** Upright rocket, nose at (cx, top); shared by Audience and Accelerator. */
function Rocket({ cx, top }: { cx: number; top: number }) {
  const y = (n: number) => top + n;
  return (
    <>
      {/* fins */}
      <path className={SOFT} d={`M${cx - 7.5} ${y(23)}l-5 5.5v7l5-2.5z`} />
      <path className={SOFT} d={`M${cx + 7.5} ${y(23)}l5 5.5v7l-5-2.5z`} />
      {/* flame */}
      <path className={ACCENT} d={`M${cx - 4} ${y(35)}c0 4.2 1.6 7.4 4 9.5 2.4-2.1 4-5.3 4-9.5z`} />
      {/* body */}
      <path className={PAPER} d={`M${cx} ${y(0)}c5 4 7.5 10 7.5 18v15h-15V18c0-8 2.5-14 7.5-18z`} />
      {/* window */}
      <circle className={SOFT} cx={cx} cy={y(15)} r={3.5} />
      {/* hull seam */}
      <path strokeWidth={1.5} d={`M${cx - 7.5} ${y(27)}h15`} />
    </>
  );
}

/* ───────────────────────── Intro cards ───────────────────────── */

/** A startup rocket lifting off beside a neighbourhood shop. */
export function PictoAudience(props: PictoProps) {
  return (
    <Frame grid={64} {...props}>
      <style>{TWINKLE_CSS}</style>
      <Rocket cx={16} top={5} />
      {/* shop body, door and window */}
      <path className={PAPER} d="M35 35v21h22V35" />
      <path d="M41.5 56V46.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V56" />
      <rect className={SOFT} x={50} y={41} width={4} height={5} rx={1} strokeWidth={1.5} />
      {/* scalloped awning */}
      <path
        className={SOFT}
        d="M35 24h22l3 8a3.5 3.5 0 0 1-7 0 3.5 3.5 0 0 1-7 0 3.5 3.5 0 0 1-7 0 3.5 3.5 0 0 1-7 0z"
      />
      <path strokeWidth={1.5} d="M41.5 24L39 32M50.5 24L53 32M46 24v8" />
      {/* ground */}
      <path d="M4 58h56" />
      {/* sparkle */}
      <path className="fdl-twinkle" strokeWidth={1.5} d="M31 9v6M28 12h6" />
    </Frame>
  );
}

/** One expediente: a folder holding three stacked documents, checked. */
export function PictoFile(props: PictoProps) {
  return (
    <Frame grid={64} {...props}>
      {/* folder back with tab */}
      <path d="M5 50V15a3 3 0 0 1 3-3h10.5l4 4.5H44a3 3 0 0 1 3 3V30" />
      {/* three documents, back to front */}
      <rect className={PAPER} x={11} y={7} width={24} height={28} rx={2} />
      <rect className={PAPER} x={15} y={11} width={24} height={26} rx={2} />
      <rect className={PAPER} x={19} y={15} width={24} height={24} rx={2} />
      <path strokeWidth={1.5} d="M24 21h14M24 25.5h9" />
      {/* folder pocket */}
      <path className={SOFT} d="M5 29h42a2 2 0 0 1 2 2v20a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
      {/* check badge */}
      <circle className={ACCENT} cx={50} cy={50} r={9} />
      <path className="stroke-surface-100" strokeWidth={2.5} d="M45.5 50.5l3 3 6-6.5" />
    </Frame>
  );
}

/** Not a loan, not a showcase: a struck-through coin behind a shield. */
export function PictoNotLoan(props: PictoProps) {
  return (
    <Frame grid={64} {...props}>
      {/* coin */}
      <circle cx={21} cy={25} r={15} />
      <path
        strokeWidth={1.5}
        d="M24.6 21.4c-.7-1.2-2-1.9-3.6-1.9-2 0-3.5 1.1-3.5 2.7s1.5 2.3 3.5 2.8c2 .4 3.6 1.2 3.6 2.9s-1.5 2.9-3.6 2.9c-1.7 0-3.1-.8-3.8-2M21 17.5v2M21 30.8v2"
      />
      {/* strike */}
      <path strokeWidth={2.5} d="M9 13l23 23" />
      {/* shield in front */}
      <path className={SOFT} d="M44 18l13 5v11c0 10.5-5.6 18-13 22-7.4-4-13-11.5-13-22V23z" />
      <path className="stroke-brand-fill" strokeWidth={2.5} d="M38.5 36l4 4 7.5-8" />
    </Frame>
  );
}

/** Test version: a flask with a dotted "beta" orbit and a satellite dot. */
export function PictoTestMode(props: PictoProps) {
  const flask = 'M27 10v14L15.6 45.6A4.5 4.5 0 0 0 19.5 52.5h25a4.5 4.5 0 0 0 3.9-6.9L37 24V10';
  return (
    <Frame grid={64} {...props}>
      <style>{ORBIT_CSS}</style>
      <g transform="rotate(-14 32 30)">
        {/* back half of the orbit, hidden behind the glass */}
        <path className="fdl-orbit" strokeDasharray="0 4.5" d="M6 30a26 7 0 0 1 52 0" />
      </g>
      {/* flask: glass, liquid, outline */}
      <path className={PAPER} d={flask} />
      <path
        className={SOFT}
        stroke="none"
        d="M18.9 40h26.2l3.3 5.6a4.5 4.5 0 0 1-3.9 6.9h-25a4.5 4.5 0 0 1-3.9-6.9z"
      />
      <path d={flask} />
      <path strokeWidth={1.5} d="M18.9 40h26.2" />
      <path d="M24 10h16" />
      <circle strokeWidth={1.5} cx={28} cy={46.5} r={2} />
      <circle strokeWidth={1.5} cx={35.5} cy={45} r={1.3} />
      <g transform="rotate(-14 32 30)">
        {/* front half of the orbit, over the glass, with the beta dot */}
        <path className="fdl-orbit" strokeDasharray="0 4.5" d="M58 30a26 7 0 0 1-52 0" />
        <circle className={ACCENT} cx={54.5} cy={33.5} r={3} />
      </g>
    </Frame>
  );
}

/* ───────────────────────── How it works ───────────────────────── */

/** Register: a company building with an intake clipboard in front. */
export function PictoRegister(props: PictoProps) {
  return (
    <Frame grid={64} {...props}>
      {/* building */}
      <path d="M8 56V15a3 3 0 0 1 3-3h20a3 3 0 0 1 3 3v8" />
      <rect className={SOFT} x={13} y={18} width={5} height={5} rx={1} strokeWidth={1.5} />
      <rect className={SOFT} x={23} y={18} width={5} height={5} rx={1} strokeWidth={1.5} />
      <rect className={SOFT} x={13} y={28} width={5} height={5} rx={1} strokeWidth={1.5} />
      <rect className={SOFT} x={13} y={38} width={5} height={5} rx={1} strokeWidth={1.5} />
      <path d="M4 56h26" />
      {/* clipboard */}
      <rect className={PAPER} x={30} y={22} width={27} height={36} rx={3} />
      <rect className={ACCENT} x={37} y={18.5} width={13} height={7} rx={2} />
      {/* form rows */}
      <path strokeWidth={1.5} d="M36 33.5l2 2 3.5-4M45 34h7M36 42.5l2 2 3.5-4M45 43h7" />
      <rect strokeWidth={1.5} x={36} y={49} width={5} height={4.5} rx={1} />
      <path strokeWidth={1.5} d="M45 51.5h5" />
    </Frame>
  );
}

/** Choose what to share: a document whose fields switch on and off. */
export function PictoChoose(props: PictoProps) {
  return (
    <Frame grid={64} {...props}>
      {/* document */}
      <path d="M44 26V16L34 6H13a4 4 0 0 0-4 4v44a4 4 0 0 0 4 4h27a4 4 0 0 0 4-4" />
      <path d="M34 6v7a3 3 0 0 0 3 3h7" />
      <path strokeWidth={1.5} d="M15 15h12M15 20h8" />
      {/* field labels */}
      <path strokeWidth={1.5} d="M15 30h6M15 46h6" />
      {/* on */}
      <rect className={ACCENT} x={26} y={24} width={30} height={13} rx={6.5} />
      <circle className={PAPER} cx={49.5} cy={30.5} r={4} />
      {/* off */}
      <rect className={SOFT} x={26} y={40} width={30} height={13} rx={6.5} />
      <circle className={PAPER} cx={32.5} cy={46.5} r={4} />
    </Frame>
  );
}

/** Share with permission: a document travelling to a padlock. */
export function PictoShare(props: PictoProps) {
  return (
    <Frame grid={64} {...props}>
      {/* document */}
      <path className={PAPER} d="M8 8h15l7 7v27a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" />
      <path d="M23 8v5a2 2 0 0 0 2 2h5" />
      <path strokeWidth={1.5} d="M10 22h13M10 27.5h13M10 33h8" />
      {/* hand-off arrow */}
      <circle className={ACCENT} cx={35} cy={12} r={2.5} />
      <path d="M38.5 10.5C46 7.5 51 11 51.5 20" />
      <path d="M47.5 16.5l4 4.5 3.5-4.8" />
      {/* padlock */}
      <path d="M42 36v-4.5a8 8 0 0 1 16 0V36" />
      <rect className={SOFT} x={37} y={35} width={24} height={22} rx={4} />
      <circle cx={49} cy={44} r={2.5} />
      <path d="M49 46.5V50" />
    </Frame>
  );
}

/* ───────────────────────── Recipients ───────────────────────── */

/** Fund: a portfolio pie with one slice drawn out, and a coin stack. */
export function PictoFund(props: PictoProps) {
  const coin = (y: number) => `M42 ${y}v4a8 3 0 0 0 16 0v-4a8 3 0 0 0-16 0a8 3 0 0 0 16 0`;
  return (
    <Frame grid={64} {...props}>
      <path className={SOFT} d="M25 30V11A19 19 0 1 0 44 30z" />
      <path className={ACCENT} d="M29 26V7a19 19 0 0 1 19 19z" />
      <path className={PAPER} d={coin(50)} />
      <path className={PAPER} d={coin(44)} />
      <path className={PAPER} d={coin(38)} />
    </Frame>
  );
}

/** Accelerator: a rocket on the climb with a rising-arrow badge. */
export function PictoAccelerator(props: PictoProps) {
  return (
    <Frame grid={64} {...props}>
      <g transform="rotate(45 28 30)">
        <Rocket cx={28} top={8} />
      </g>
      {/* speed lines */}
      <path strokeWidth={1.5} d="M8 40l-3 3M14 47l-4 4M20 53l-3 3" />
      <circle className={ACCENT} cx={50} cy={50} r={9} />
      <path className="stroke-surface-100" strokeWidth={2.5} d="M50 55v-9.5M46 49.5l4-4 4 4" />
    </Frame>
  );
}

/** Lender: a classic bank front with columns. */
export function PictoLender(props: PictoProps) {
  return (
    <Frame grid={64} {...props}>
      <path className={SOFT} d="M32 6L59 21H5z" />
      <circle className={ACCENT} cx={32} cy={15} r={2.5} strokeWidth={1.5} />
      <path d="M8 26h48" />
      <rect className={PAPER} x={11} y={30} width={6} height={18} rx={1} />
      <rect className={PAPER} x={23} y={30} width={6} height={18} rx={1} />
      <rect className={PAPER} x={35} y={30} width={6} height={18} rx={1} />
      <rect className={PAPER} x={47} y={30} width={6} height={18} rx={1} />
      <path d="M7 52h50M4 57h56" />
    </Frame>
  );
}

/* ───────────────────────── Q&A topic tabs (24px) ───────────────────────── */

export function TopicStartup(props: PictoProps) {
  return (
    <Frame grid={24} {...props}>
      <path d="M8.5 13.5L5 17v3l3.5-1.8M15.5 13.5L19 17v3l-3.5-1.8" />
      <path className={SOFT} d="M12 2.5c2.4 2 3.5 4.9 3.5 8.5v7h-7v-7c0-3.6 1.1-6.5 3.5-8.5z" />
      <circle cx={12} cy={9.5} r={1.5} strokeWidth={1.5} />
      <path d="M10.5 21.5h3" />
    </Frame>
  );
}

export function TopicMype(props: PictoProps) {
  return (
    <Frame grid={24} {...props}>
      <path
        className={SOFT}
        d="M5 3.5h14L21 9a2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0A2.25 2.25 0 0 1 3 9z"
      />
      <path d="M5 13v7.5h14V13M10 20.5V16h4v4.5" />
    </Frame>
  );
}

export function TopicData(props: PictoProps) {
  return (
    <Frame grid={24} {...props}>
      <path className={SOFT} d="M12 2.5l7.5 3v6c0 5-3.2 8.6-7.5 10-4.3-1.4-7.5-5-7.5-10v-6z" />
      <rect x={9} y={11} width={6} height={5} rx={1} strokeWidth={1.5} />
      <path strokeWidth={1.5} d="M10.25 11V9.5a1.75 1.75 0 0 1 3.5 0V11" />
    </Frame>
  );
}

export function TopicAbout(props: PictoProps) {
  return (
    <Frame grid={24} {...props}>
      <path
        className={SOFT}
        d="M6 3.5h12A2.5 2.5 0 0 1 20.5 6v8a2.5 2.5 0 0 1-2.5 2.5h-6.5l-5 4v-4H6A2.5 2.5 0 0 1 3.5 14V6A2.5 2.5 0 0 1 6 3.5z"
      />
      <path d="M9.8 8.2a2.3 2.3 0 1 1 3.3 2.1c-.7.3-1.1.9-1.1 1.6v.3" />
      <circle cx={12} cy={14.2} r={0.4} />
    </Frame>
  );
}
