import { useId } from 'react';

/**
 * The Fondealo mark: a company passport (rounded booklet with a spine) whose
 * front carries three rising bars, circled by a tilted orbit with a node.
 *
 * Construction is flat and token-driven. One geometry serves both variants:
 * the orbit passes *in front* of the passport across its lower third and
 * *behind* it at the top, and every overlap is resolved with a knock-out gap
 * (an SVG luminance mask), so the same drawing reads in full colour and in a
 * single `currentColor`. The bars stand on the orbit: their feet run parallel
 * to it, so the orbit doubles as the chart's baseline.
 *
 * Two drawings exist: the full mark on a 48 grid, and a bolder small-size cut
 * on a 16 grid (two bars, solid node, pixel-aligned) used at 20px and below.
 */

export type MarkVariant = 'color' | 'mono';

type Geometry = {
  grid: number;
  body: { x: number; y: number; w: number; h: number; r: number };
  /** Optional booklet spine, cut out of the body. */
  spine?: { x: number; w: number };
  orbit: { cx: number; cy: number; rx: number; ry: number; rot: number; w: number };
  /** Knock-out gap around every overlap. */
  gap: number;
  /** Strip of body kept between a bar's foot and the orbit's gap. */
  foot: number;
  bars: { x: number; w: number; top: number }[];
  barRadius: number;
  /** Node on the orbit, at parametric angle `t` (degrees, 0 = right end). */
  node: { t: number; r: number; hole: number };
};

const FULL: Geometry = {
  grid: 48,
  body: { x: 12.5, y: 8, w: 20, h: 31, r: 3.5 },
  spine: { x: 15, w: 1.25 },
  orbit: { cx: 23.5, cy: 25, rx: 20.5, ry: 7.5, rot: -12, w: 2.5 },
  gap: 1.5,
  foot: 1.25,
  bars: [
    { x: 18.5, w: 3.5, top: 21 },
    { x: 23, w: 3.5, top: 16 },
    { x: 27.5, w: 3.5, top: 11 },
  ],
  barRadius: 1,
  node: { t: 0, r: 3.25, hole: 1.4 },
};

const SMALL: Geometry = {
  grid: 16,
  body: { x: 4, y: 1, w: 8, h: 14, r: 1.5 },
  orbit: { cx: 7.75, cy: 8.75, rx: 6.75, ry: 3, rot: -12, w: 1.5 },
  gap: 0.75,
  foot: 0.5,
  bars: [
    { x: 6, w: 2, top: 6 },
    { x: 9, w: 2, top: 3 },
  ],
  barRadius: 0.5,
  node: { t: 0, r: 1.4, hole: 0 },
};

const r2 = (n: number) => Math.round(n * 100) / 100;

function point(g: Geometry, deg: number): [number, number] {
  const { cx, cy, rx, ry, rot } = g.orbit;
  const t = (deg * Math.PI) / 180;
  const p = (rot * Math.PI) / 180;
  return [
    r2(cx + rx * Math.cos(t) * Math.cos(p) - ry * Math.sin(t) * Math.sin(p)),
    r2(cy + rx * Math.cos(t) * Math.sin(p) + ry * Math.sin(t) * Math.cos(p)),
  ];
}

/** y of the front (lower) half of the orbit at a given x. */
function frontY(g: Geometry, x: number): number {
  let best = { dx: Infinity, y: 0 };
  for (let deg = 0; deg <= 180; deg += 0.25) {
    const [px, py] = point(g, deg);
    const dx = Math.abs(px - x);
    if (dx < best.dx) best = { dx, y: py };
  }
  return best.y;
}

type Built = {
  grid: number;
  body: Geometry['body'];
  spine?: Geometry['spine'];
  orbit: Geometry['orbit'];
  front: string;
  bars: { x: number; y: number; w: number; h: number }[];
  barRadius: number;
  band: number;
  knock: number;
  node: { cx: number; cy: number; r: number; hole: number; cut: number };
  bodyCut: { x: number; y: number; w: number; h: number; r: number };
};

function build(g: Geometry): Built {
  const { rx, ry, rot } = g.orbit;
  const [lx, ly] = point(g, 180);
  const [bx, by] = point(g, 90);
  const [ex, ey] = point(g, 0);
  // Front half, left end → lowest point → right end (two quarter arcs).
  const front = `M${lx} ${ly}A${rx} ${ry} ${rot} 0 0 ${bx} ${by}A${rx} ${ry} ${rot} 0 0 ${ex} ${ey}`;
  const [ncx, ncy] = point(g, g.node.t);
  return {
    grid: g.grid,
    body: g.body,
    spine: g.spine,
    orbit: g.orbit,
    front,
    // Bars run down to the orbit's centre line; the band mask trims their feet
    // parallel to the orbit.
    bars: g.bars.map((b) => {
      const bottom = r2(frontY(g, b.x + b.w / 2) + 0.5);
      return { x: b.x, y: b.top, w: b.w, h: r2(bottom - b.top) };
    }),
    barRadius: g.barRadius,
    band: r2(g.orbit.w + 2 * (g.gap + g.foot)),
    knock: r2(g.orbit.w + 2 * g.gap),
    node: { cx: ncx, cy: ncy, r: g.node.r, hole: g.node.hole, cut: r2(g.node.r + g.gap) },
    bodyCut: {
      x: g.body.x - g.gap,
      y: g.body.y - g.gap,
      w: g.body.w + 2 * g.gap,
      h: g.body.h + 2 * g.gap,
      r: g.body.r + g.gap,
    },
  };
}

const BUILT = { full: build(FULL), small: build(SMALL) };

// Token classes (Tailwind, theme-aware). Mono uses currentColor throughout.
const TONES = {
  color: {
    body: 'fill-mark-body',
    bars: 'fill-brand-fill',
    orbit: 'stroke-orbit',
    node: 'fill-brand-fill',
    hole: 'fill-mark-body',
  },
  mono: { body: undefined, bars: undefined, orbit: undefined, node: undefined, hole: undefined },
} as const;

export type FondealoMarkProps = {
  size?: number;
  className?: string;
  variant?: MarkVariant;
  /** Accessible name. Without it the mark is decorative (aria-hidden). */
  title?: string;
};

/** Ring (annulus) as one even-odd path, so its centre is a true hole. */
function ringPath(cx: number, cy: number, r: number, hole: number) {
  const c = (rad: number) =>
    `M${r2(cx - rad)} ${cy}a${rad} ${rad} 0 1 0 ${r2(2 * rad)} 0a${rad} ${rad} 0 1 0 ${r2(-2 * rad)} 0Z`;
  return hole > 0 ? c(r) + c(hole) : c(r);
}

export function FondealoMark({
  size = 32,
  className,
  variant = 'color',
  title,
}: FondealoMarkProps) {
  const uid = `mk${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const g = size <= 20 ? BUILT.small : BUILT.full;
  const tone = TONES[variant];
  const mono = variant === 'mono';
  const fillOf = (cls: string | undefined) =>
    mono ? { fill: 'currentColor' } : { className: cls };
  const strokeOf = (cls: string | undefined) =>
    mono ? { stroke: 'currentColor' } : { className: cls };
  const ids = {
    body: `${uid}-body`,
    ring: `${uid}-ring`,
    feet: `${uid}-feet`,
    node: `${uid}-node`,
    title: `${uid}-title`,
  };
  const { body, orbit, node } = g;
  const full = { x: 0, y: 0, width: g.grid, height: g.grid };
  const nodeCut = <circle cx={node.cx} cy={node.cy} r={node.cut} fill="black" />;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${g.grid} ${g.grid}`}
      width={size}
      height={size}
      fill="none"
      className={className}
      focusable="false"
      {...(title ? { role: 'img', 'aria-labelledby': ids.title } : { 'aria-hidden': true })}
    >
      {title ? <title id={ids.title}>{title}</title> : null}
      <defs>
        {/* Feet: everything except a band around the front of the orbit. */}
        <mask id={ids.feet} maskUnits="userSpaceOnUse" {...full}>
          <rect {...full} fill="white" />
          <path d={g.front} stroke="black" strokeWidth={g.band} />
        </mask>
        {/* Body: knocked out where the orbit and the node pass in front. */}
        <mask id={ids.body} maskUnits="userSpaceOnUse" {...full}>
          <rect {...full} fill="white" />
          <path d={g.front} stroke="black" strokeWidth={g.knock} />
          {nodeCut}
          {g.spine ? (
            <rect x={g.spine.x} y={body.y} width={g.spine.w} height={body.h} fill="black" />
          ) : null}
          {mono
            ? g.bars.map((b) => (
                <rect
                  key={b.x}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx={g.barRadius}
                  fill="black"
                  mask={`url(#${ids.feet})`}
                />
              ))
            : null}
        </mask>
        {/* Ring: hidden behind the body (with a gap) and around the node. */}
        <mask id={ids.ring} maskUnits="userSpaceOnUse" {...full}>
          <rect {...full} fill="white" />
          <rect
            x={g.bodyCut.x}
            y={g.bodyCut.y}
            width={g.bodyCut.w}
            height={g.bodyCut.h}
            rx={g.bodyCut.r}
            fill="black"
          />
          {nodeCut}
        </mask>
        <mask id={ids.node} maskUnits="userSpaceOnUse" {...full}>
          <rect {...full} fill="white" />
          {nodeCut}
        </mask>
      </defs>

      {/* Orbit, back half and ends (cut where it passes behind the passport). */}
      <ellipse
        cx={orbit.cx}
        cy={orbit.cy}
        rx={orbit.rx}
        ry={orbit.ry}
        transform={`rotate(${orbit.rot} ${orbit.cx} ${orbit.cy})`}
        strokeWidth={orbit.w}
        mask={`url(#${ids.ring})`}
        {...strokeOf(tone.orbit)}
      />
      {/* Passport. */}
      <rect
        x={body.x}
        y={body.y}
        width={body.w}
        height={body.h}
        rx={body.r}
        mask={`url(#${ids.body})`}
        {...fillOf(tone.body)}
      />
      {/* Bars (colour only; in mono they are windows cut into the body). */}
      {mono ? null : (
        <g mask={`url(#${ids.feet})`} className={tone.bars}>
          {g.bars.map((b) => (
            <rect key={b.x} x={b.x} y={b.y} width={b.w} height={b.h} rx={g.barRadius} />
          ))}
        </g>
      )}
      {/* Orbit, front half: crosses over the passport. */}
      <path
        d={g.front}
        strokeWidth={orbit.w}
        mask={`url(#${ids.node})`}
        {...strokeOf(tone.orbit)}
      />
      {/* Node: a ring with a dark centre (a true hole in mono). */}
      <path
        d={ringPath(node.cx, node.cy, node.r, mono ? node.hole : 0)}
        fillRule="evenodd"
        {...fillOf(tone.node)}
      />
      {!mono && node.hole > 0 ? (
        <circle cx={node.cx} cy={node.cy} r={node.hole} className={tone.hole} />
      ) : null}
    </svg>
  );
}

export type FondealoLogoProps = {
  className?: string;
  /** Height of the mark in px; the wordmark scales with it. */
  size?: number;
  variant?: MarkVariant;
  /** Accepted for API compatibility with the old raster logo; unused. */
  priority?: boolean;
};

/**
 * Lockup: mark + "Fondealo" set in the brand face. The word takes the
 * surrounding text colour, so callers tint it with `text-*` classes.
 */
export function FondealoLogo({ className, size = 32, variant = 'color' }: FondealoLogoProps) {
  return (
    <span
      className={['inline-flex shrink-0 items-center', className].filter(Boolean).join(' ')}
      style={{ gap: Math.round(size * 0.3) }}
    >
      <FondealoMark size={size} variant={variant} className="shrink-0" />
      <span
        className="font-brand font-semibold leading-none"
        style={{ fontSize: Math.round(size * 0.56), letterSpacing: '-0.02em' }}
      >
        Fondealo
      </span>
    </span>
  );
}
