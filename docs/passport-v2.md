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
- **Dynamic score visualisation** — `ScoreRing`: a 270° gradient arc with an SVG glow filter, tick ring, and a CSS draw-in; a `requestAnimationFrame` count-up on the number. Optional "Credit signals" rows (`signals` prop) sit under the stats, as in the landing demo.
- **Risk badge** — a metallic pill, colour-mapped per band (A→E), with a plain-language grade (`Prime`, `Strong`, `Building`, `Watch`, `High risk`).
- **Reputation timeline** — the existing "Reputation journey" card on `/business/passport` is kept and feeds off the same passport data (`loansRepaid`, `onTimeStreak`).
- **Interactive states** — pointer-tracked 3D tilt + parallax highlight; hover elevation + emerald glow; all disabled for `pointerType === 'touch'` and under `prefers-reduced-motion`.

## Credit Reputation Ring (landing section, not the passport)

The multi-layer ring lives in the landing page's dedicated "Credit Reputation Ring" section (`components/reputation-ring.tsx`) to explain how reputation is read; the Passport card itself keeps the single-score `ScoreRing`. The four-layer ring is interactive: hovering or focusing a legend row spotlights its ring and shows that layer's value in the centre.

The on-chain score stays **one deterministic number** (`Passport.score`, see `docs/score-spec.md`). The ring is a *view* over real Passport fields via `reputationLayers()` in `@fondealo/types` (unit-tested), so nothing on it is fabricated:

| Layer | Value (0–100) | Source |
| --- | --- | --- |
| Identity | KYB Accepted = 100, Processing = 50, else 0 | `kybStatus` |
| Repayment | loans repaid ÷ loans taken | `loansRepaid / loansTotal` |
| Activity | loans taken, full at 10 loans | `loansTotal` |
| Longevity | months of history, full at 24 months | `updatedAt − issuedAt` (no wall clock, so SSR and client agree) |

The card also shows a business identity line (`holder`), an optional stat override (`stats`, used by the landing demo) and a "View on-chain ↗" link (`explorerUrl`) that is only set when the passport was read from chain — never for demo data.

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

`components/passport-card.tsx` (the old flat version), `components/address-lookup-banner.tsx`, `components/score-ring.tsx` and `components/score-gauge.tsx` were removed.

## Two layers and owner customization (v3)

The Passport card is split so personalization never touches credit semantics:

| Layer | Who controls it | What it shows |
| --- | --- | --- |
| **Identity** (top) | The business — colour theme, pattern | `FONDEALO · STELLAR`, business name, "Business Passport", place |
| **Trust** (bottom) | Fondealo + the on-chain record — fixed styling | KYB status, credit score ring + risk band, repaid / on-time / history, "Verified on-chain" |

- **Themes:** Emerald, Electric cyan, Aurora, Violet, Midnight gold, or a custom accent
  (`lib/passport-theme.ts`). A custom accent is turned into a palette with clamped lightness so
  the identity panel always stays dark enough for white text. Patterns: lines, dots, clean.
- **Persistence:** off-chain, in `Business.passportTheme / passportAccent / passportPattern`
  (migration `20260921120000_passport_theme`). Saved via the `savePassportTheme` server action,
  which requires a verified Business session and validates every value; it cannot touch any credit
  field. Investors viewing an opportunity see the borrower's saved look.
- **Editing UI:** `/business/passport` → `PassportStudio` (live preview, colour transitions via
  registered CSS properties, custom colour picker). The landing hero and the "Yours to style.
  Ours to verify." section let visitors try the swatches.
- **On-chain:** the contract only stores an optional `metadata_uri` pointer; see
  [ADR-0009](adr/0009-non-transferable-business-passport.md).

### Hydration note

Client components format numbers with an explicit `en-US` locale. Using the runtime default
(`toLocaleString()`) rendered `5000` on the server and `5,000` in the browser, which is a React
hydration error — and would break for any visitor whose browser locale differs from the server's.
