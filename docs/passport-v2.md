# Business Passport V2 — design note

**Goal:** make the Business Passport the single most memorable object in the product —
"identidad financiera premium / credencial verificable / activo digital", not a form.

## Reference set

| Reference | What we took |
| --- | --- |
| **Amex Centurion / Visa Infinite** | Dark "metal" card, embossed hierarchy, a rotating metallic rim, weight and restraint over decoration |
| **Apple Wallet** | The object *is* the UI; rounded 24px radius; front-and-centre, tappable, tactile (3D tilt) |
| **World ID** | "Verified" as a first-class visual state — a seal, not a label |
| **Stripe Identity / Mercury / Brex / Ramp** | Calm fintech surface, glass panels, one accent colour, monospaced identifiers, generous negative space |

## What shipped

`components/passport-v2.tsx` + `components/score-ring.tsx` + `~200` lines of scoped CSS in
`app/globals.css` (`.fdo-passport*`).

- **Glassmorphism** — `backdrop-blur` inner panel over a layered carbon gradient.
- **Animated gradient** — a registered `@property --rim-a` conic gradient rim that slowly rotates (emerald → gold), plus a cursor-tracked radial highlight.
- **Verification effects** — a holographic sheen that sweeps on hover, an EMV-style chip, a contactless glyph, a "Verified on Stellar" seal.
- **Dynamic score visualisation** — `ScoreRing`: a 270° gradient arc with an SVG glow filter, tick ring, and a CSS draw-in; a `requestAnimationFrame` count-up on the number.
- **Risk badge** — a metallic pill, colour-mapped per band (A→E), with a plain-language grade (`Prime`, `Strong`, `Building`, `Watch`, `High risk`).
- **Trust indicators** — KYB verified / On-chain / Portable, lit or dimmed by real passport state.
- **Reputation timeline** — the existing "Reputation journey" card on `/business/passport` is kept and feeds off the same passport data (`loansRepaid`, `onTimeStreak`).
- **Interactive states** — pointer-tracked 3D tilt + parallax highlight; hover elevation + emerald glow; all disabled for `pointerType === 'touch'` and under `prefers-reduced-motion`.

## Library evaluation — and why we added nothing

| Candidate | Verdict |
| --- | --- |
| **Framer Motion / `motion`** | ~34 kB gz + forces a client boundary for a mostly-static credential. Every motion we need (tilt, count-up, sheen, draw-in, glow) is a few lines of CSS `@keyframes` or one `rAF` loop. Rejected. |
| **Aceternity UI / Magic UI** | Copy-paste component sets that *themselves* depend on Framer Motion + often `tailwind-merge`/`clsx` variants. Same cost, less control over the exact card language. Rejected. |
| **React Bits** | Same. Rejected. |
| **Origin UI / shadcn animations** | Useful patterns; the actual primitives here (Card, Badge) already live in `@fondealo/ui`. Rejected as a dependency; borrowed ideas only. |

**Net dependency delta: 0.** The passport is pure React + Tailwind + scoped CSS, server-renderable, and degrades to a clean static card.

## Where it renders

- `/` hero — `variant="showcase"` (floats), demo passport.
- `/business` and `/business/passport` — the logged-in business's real passport.
- `/invest/opportunity/[id]` — the borrower's passport, shown to investors for risk assessment.

`components/passport-card.tsx` (the old flat version) and `components/address-lookup-banner.tsx` were removed.
