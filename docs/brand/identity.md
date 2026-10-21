# Fondealo identity — Sprint 1 of the controlled redesign

**Date:** 2026-10-21 · **Status:** proposal, in review · **Branch:** `feat/identity-sprint-1`

We stop patching the current landing section by section. The redesign runs in
four sprints, and each one ends with something we can look at and approve:

| Sprint                      | Scope                                                                    | Done when                                                                     |
| --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **1 · Identity** (this doc) | Logo system, colour, type, icons, tokens, vocabulary                     | The specimen page (`/design-system#identidad`) is approved in Night and Day   |
| **2 · Homepage**            | Navbar, hero, problem, passport, sharing, Stellar, CTA. Nothing else     | Each section is built from the identity only, no one-off styles               |
| **3 · Motion**              | Passport assembly, trust graph, verification states, scroll interactions | Every motion has a reduced-motion fallback and a pause control where it loops |
| **4 · Polish**              | Responsive, accessibility (WCAG 2.2 AA), performance                     | Lighthouse and the four design auditors pass                                  |

Work from the current PR #19 (`share-flow`, `qa-section`, `value-cards`) is
kept as raw material for Sprint 2, not shipped as is.

## 1. The idea

> On Fondealo, **the company passport** becomes **the lit object in a dark room**.

The ground is one dark field (Night). On it, the passport is the brightest thing
on every screen: it is assembled, it collects signals, and parts of it are
shared with the people who fund the company. The competitor test passes: a bank,
a lending marketplace or a data room has no passport object of its own. The
passport already exists in the product (`business_passport` contract,
`passport-v2.tsx`), so the landing promises what the app shows.

**The one live thing (Sprint 2):** the visitor chooses which parts of a sample
passport a fund, a lender and an accelerator can see, and reads exactly what
each one receives.

Direction dealt by taste-skill: _The dark room_ (seed 1282567661). Type kept from
the draw. The dealt palette (plum-black and pink) was **not** used: Fondealo
already has its own colours in its badge (blue-black, mint, orbit cyan), so we
kept the dealt proportions and took the colours from the brand.

## 2. Vocabulary

Words that make Fondealo read as a platform, not a document manager. Spanish
(es-PE) is the source; English is for `/en`.

| es-PE                     | en                   | Means                                                       | Rule                                                                                                          |
| ------------------------- | -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Pasaporte de empresa**  | Company Passport     | The company's portable record: identity, activity, payments | Replaces "expediente" in marketing. Keep "expediente" only in legal/consent text where it is the precise word |
| **Señales de confianza**  | Trust Signals        | Each fact on the passport with its source                   | Always show the source next to the signal                                                                     |
| **Actividad verificada**  | Verified Activity    | Activity confirmed by a named source                        | Say _verificada_ only when a source checked it. Otherwise _declarada_ (self-reported) or _registrada_         |
| **Reputación financiera** | Financial Reputation | The repayment and payment track record                      | Never a promise of credit or a rating by Fondealo                                                             |
| **Acceso con permiso**    | Permissioned Access  | The company decides who sees which part, and can revoke     | Every share has a revoke                                                                                      |
| **Red de financiamiento** | Financing Network    | Funds, lenders, accelerators who can receive passports      | No real names, logos or counts until there are signed partners                                                |

Retire in marketing copy: _información_, _documentos_, _archivo_ used as nouns
for the product, and "file" in English.

## 3. Claims guardrails

The brief's hero mock (`BUILT ON STELLAR ● … VERIFIED 92%`) is a good
composition and is kept as a concept, with these limits while Fondealo is in
pilot and the contracts are not yet on Testnet (`docs/dev-plan-2026-Q4.md` §1):

- **Stellar:** "Construido sobre Stellar · piloto" / "Built on Stellar · pilot".
  No "live", "on-chain" or "audited" until the contracts are deployed.
- **Scores and percentages:** none in marketing unless the object is labelled
  _Ejemplo_ / _Sample_ on its face. No "verified 92%".
- **Sample companies** (e.g. "Kalpa Labs") are fictional and labelled as samples.
- **Fondealo does not lend or invest.** Recipients decide; Fondealo shares.
- The headline promise "Hazla verificable" is an aim the product works toward,
  so the line under it must say how (sources, permission), not imply it is done.

## 4. Logo system

The symbol keeps the badge's three ideas: **the passport** (a booklet), **the
track record** (rising bars on its cover) and **the orbit** (the network it
travels through, with a node). Flat vector, no 3D, gradient or glow.

- **Files:** `apps/web/src/components/brand/mark.tsx` (`FondealoMark`,
  `FondealoLogo`), `apps/web/public/favicon.svg`. `Logo` in
  `components/logo.tsx` renders the new lockup.
- **Variants:** colour (body `mark-body`, bars `brand-fill`, orbit `orbit`) and
  mono (`currentColor`, for one-colour print, on mint, embossing).
- **Lockup:** mark + "Fondealo" in Unbounded 600, sentence case.
- **Minimum size:** 16px for the mark (favicon), 24px for the lockup.
- **Clear space:** the height of the orbit node on every side.
- **Don't:** recolour the parts, add effects, put the colour mark on mint or on a
  photograph, stretch, or set the wordmark in another face.
- **Two forms of one mark.** The 3D glass badge (`orbital-badge.png`) is the
  hero form: hero, social cards, launch moments, 96px and up. The flat vector is
  the working form: favicon, navbar, app, mono, everything under 96px.

## 5. Colour

One ground, one ink, one accent. Tokens live in `packages/ui/src/styles.css`;
Night is the default theme.

| Role          | Token                          | Night       | Day         | Use                                                             |
| ------------- | ------------------------------ | ----------- | ----------- | --------------------------------------------------------------- |
| Ground        | `surface-0`                    | 7 11 22     | 248 250 252 | The room                                                        |
| Panels        | `surface-100/200/300`          | tone steps  | tone steps  | Separation by tone, never by line or shadow                     |
| Ink           | `ink`                          | 241 245 249 | 15 23 42    | All running text                                                |
| Secondary ink | `ink-muted`                    | 148 163 184 | 71 85 105   | Notes, captions only                                            |
| **Accent**    | `brand-fill`                   | 52 211 153  | 16 185 129  | The primary action and one other thing per screen               |
| Orbit         | `orbit` (new)                  | 34 211 238  | 8 145 178   | The mark, and the second series in charts. Never on buttons     |
| Mark body     | `mark-body` (new)              | 37 78 166   | 14 42 92    | The mark and the passport object only                           |
| Status        | `gold-*`, `danger-*`, `info-*` |             |             | States (pending, error, info). Gold is no longer a brand colour |

## 6. Type

Two faces (down from four), plus mono inside the app for addresses and hashes.

| Role                  | Face                                                | Setting                                                                                  |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Brand / display       | **Unbounded** 500–700 (`font-brand`)                | Wordmark and marketing headlines only. Sentence case, tracking −0.02em, leading 1.0–1.05 |
| Text and app headings | **Onest** 400/500/600 (`font-sans`, `font-display`) | Body 16–19px, leading 1.5–1.6                                                            |
| Ledger                | JetBrains Mono (`font-mono`)                        | In-app identifiers only. Never on the landing                                            |

The draw asked for Unbounded 800 in uppercase. We use sentence case at 600:
Spanish headlines run long, and wide uppercase at display size breaks the
two-line rule. Removed: Space Grotesk, Instrument Sans, Fraunces (unused).

Five-step scale for the landing: small 14px · body 17–19px · lead 20–26px ·
heading 32–64px · display 48–96px.

## 7. Icons — two tiers

| Tier                              | Style                                                                           | Where                                        | Size                                        |
| --------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------- |
| **3D glass** ("Visual System 01") | Blue to cyan glass objects on a lit pedestal, from the brand sheet              | Landing, onboarding, empty states, marketing | 96px and up, raster (WebP/PNG, transparent) |
| **Line**                          | 24px grid, 1.8 stroke, round caps, `currentColor` (`packages/ui/src/icons.tsx`) | UI controls, lists, badges, the app          | 16 to 24px                                  |

The 3D tier is a brand asset, so the "no gradients, no glow" layout rule does
not apply inside it. It still applies to the page around it: flat panels, no
glow behind the objects, and no glass cards wrapping them. The object is the
light source in the dark room.

Core 3D set and its words in the new vocabulary:

| Sheet             | Use as                        | Note                                                                              |
| ----------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| Company           | Identidad                     |                                                                                   |
| Identity          | Identidad del representante   |                                                                                   |
| Documents         | —                             | Replace with a **Pasaporte** object (missing: the core object has no 3D icon yet) |
| Activity          | Actividad verificada          |                                                                                   |
| Payments          | Reputación financiera / pagos |                                                                                   |
| Share             | Acceso con permiso            |                                                                                   |
| Investor / Funder | Fondo / prestamista           |                                                                                   |
| Accelerator       | Aceleradora                   |                                                                                   |
| Permissions       | Acceso con permiso            |                                                                                   |
| Reputation        | Señales de confianza          |                                                                                   |
| History           | Historial                     |                                                                                   |
| Settings          | App only                      | Not on the landing                                                                |

**Files.** `apps/web/public/brand/3d/<name>.webp` (12 icons, about 300px
square, transparent) and `badge.webp` (the 3D logo, 512px, 28 KB against the
900 KB PNG). Component: `Icon3D` / `BrandBadge3D` in
`apps/web/src/components/brand/icon-3d.tsx`, capped at 150 CSS px so the
sources stay sharp on 2x screens. They were cut from the transparent sheet
_Fondealo Neon Glass Icon Kit.png_. For anything larger than 150px, export each
icon again at 600px or more.

The flat landing pictograms in `components/landing/art` are retired when the 3D
set lands.

## 8. Open questions for review

1. Approve the move from "expediente" to "pasaporte de empresa" in marketing.
2. Approve Unbounded as the brand face. It is wide and constructed; the
   alternative is a single-face identity in Onest.
3. Approve dropping gold as a brand colour.
