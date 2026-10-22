# Landing and Testnet frontend audit

**Date:** 2026-10-22 · **Commit audited:** `e3664fb` (`main`, "sprint 1 identity system") · **Branch with fixes:** `claude/relaxed-hamilton-i0ke05`

## Scope and limits

- **Audited:** the public landing (`/`, `/en`) rendered from the audited commit in desktop (1440×900) and mobile (390×844), Night and Day; route behaviour; typecheck, lint, tests; a production build.
- **Not audited:** the deployed site. `fondealo.xyz` is not reachable from the review sandbox, so I assume the deployment matches `main`. Confirm the deployed commit before comparing.
- **Not exercised:** authenticated Testnet flows (Privy sign-in, KYB intake, Passport, test ledger). The sandbox has no Privy app or database; `/onboarding` correctly shows "login unavailable in this preview". Those screens are reviewed from code only.
- Labels: **[E]** measured or observed, **[I]** inference.

## Verdict

The user's reading is right. The engineering is sound; the page fails as a landing.

| # | Finding | Evidence | Sev |
| --- | --- | --- | --- |
| L1 | **It reads as a document manager.** The hero object is a checklist of documents ("Constitución", "Ficha RUC", "Listo / Falta"). The vocabulary is _expediente_, which `docs/brand/identity.md` §2 retired in favour of _Pasaporte de empresa_. | Screenshots [E] | High |
| L2 | **No visual resource at all.** 0 `<img>`, 0 `<canvas>` in the document, while 12 3D icons and the 3D badge sit in `public/brand/3d` and are only used on `/design-system`. | DOM count [E] | High |
| L3 | **Too much text, repeated.** 842 words, 9 sections, 7,594 px desktop / 8,808 px mobile. Four definition columns ("What it is / is not / where it stands"), then the same disclaimers again in the hero, "does not do", "today", FAQ and form. "prueba" appears 8 times and "expediente" 10 times in the Spanish copy. | Counts from `content.ts` [E] | High |
| L4 | **"Cómo funciona" is 2,000 px (26% of the page)** with about 500 px of empty space between steps while a sticky panel waits. | Section measurement [E] | Medium |
| L5 | **The dark room breaks.** In Night, "Lo que Fondealo no hace" is a near-white band and the CTA is a full mint block. The identity's idea is one dark field with the passport as the lit object. | Screenshots [E] | Medium |
| L6 | **No section navigation on mobile.** The inline nav is hidden below `lg` and there is no menu, while the app's own navbar has one. | `navigation display:none` at 390 px [E] | Medium |
| L7 | Secondary hero link is indented on mobile (`link` variant `px-0` loses to `size lg px-6`). | Screenshot [E] | Low |
| L8 | Page title, meta description and keywords still say "expediente". | `layout.tsx`, `landing-page.tsx` [E] | Low |
| P1 | **The public landing ships the Privy SDK.** One 1.9 MB raw (about 574 KB gzip) chunk, containing Privy, loads on `/` and `/en`, because `PrivyProviders` wraps the whole app in the root layout and imports statically. The landing needs none of it. Not changed here: moving it needs route groups, and I cannot test sign-in without Privy credentials. | Chunk inspection on a production build [E] | High |
| F1 | Baseline is healthy: `tsc` clean, lint clean, 223 tests passing; logged-out `/business`, `/invest`, `/invest/market` and `/business/passport` redirect to `/onboarding`; `/nope` is a 404. `/api/health` returns 503 locally only because there is no database. | Route probe [E] | Info |

## What was changed

All on this branch; no behaviour of the app (auth, KYB, ledger, contracts) was touched.

| Finding | Change |
| --- | --- |
| L1, L8 | New hook and vocabulary from `identity.md` §2 and §9: "Tu empresa ya tiene una historia. Hazla verificable." The hero object is now the passport. Meta and layout updated. |
| L2 | A real 3D hero (three.js): passport, orbit, signals, links to the network. Colours come from the tokens. The existing 3D icons are used for the layers and recipients, and the 3D badge for the CTA. |
| L3, L4 | Nine sections became five plus the form: hero, Signals, Access, What is real today, FAQ. 842 words became about 550 visible. Page height 7,594 px became about 4,800 px (−37%). One disclaimer per place it matters. |
| L5 | One dark field in Night; flat tone steps only. No white band, no mint block. |
| L6, L7 | Mobile menu with the section links, account link, language and theme. Header no longer overflows at 320 px (fixed while testing: the first version of the menu pushed the header to 418 px). |
| Guardrails | `landing.test.ts` kept every claims, token, type-size and no-monospace rule and added: passport vocabulary, labelled examples, no real names as partners, a word budget, mobile menu present, 3D stage with poster and label. |

## Measured after (production build, headless Chromium, software WebGL)

| | Before | After |
| --- | --- | --- |
| Visible words | 842 | ~550 |
| Desktop page height | 7,594 px | ~4,820 px |
| Landing HTML | 165 KB (dev) | 88 KB |
| LCP / CLS | n/a | 0.9 s / 0 desktop, 0.24 s / 0 mobile (local, unthrottled) |
| three.js | n/a | 171 KB gzip, lazy chunk, loaded when idle and only if WebGL works |
| Horizontal overflow at 320 px | none | none |

Network was not throttled and WebGL ran in software, so treat the timings as relative. Run Lighthouse on a Vercel preview before quoting numbers.

## Copy and claims decisions (need a human)

1. **Primary CTA wording.** The brief proposed "Create your passport". Sign-up today is a waitlist and the app records a test-mode intake, so "create" over-promises. I used **"Reservar mi pasaporte" / "Reserve my passport"**. Flip it in `content.ts` (`hero.cta`) if you want the brief's wording, but then the button should lead to the test sign-up, not the waitlist.
2. **"Verified Activity", "Financial Reputation".** Kept as layer names, only inside an object labelled _Ejemplo_ / _Sample_, with the three states (Verificada / Declarada / Pendiente) defined next to it. Nothing is verified by Fondealo today.
3. **"Financing network".** Shown with sample recipients and the line "no signed partners yet". No real names, logos or counts, per `identity.md` §3.
4. **Stellar.** "Built on Stellar · pilot" only; no "live", "on-chain" or "audited".

## Open items

| Item | Why | Suggested owner |
| --- | --- | --- |
| P1: take Privy off the public routes | About 570 KB gzip on the LCP path for a page that does not log anyone in. Put `/` and `/en` in a route group whose layout has no `PrivyProviders`; keep the root layout for fonts and theme. Verify sign-in on a preview with real keys. | Web |
| Audit the authenticated Testnet flows on a preview | Not reachable in this sandbox. Review onboarding, application status, passport and the test ledger with Privy and a Development database. | Web / QA |
| Lighthouse and the four design auditors (Sprint 4) | The agents in `.claude/agents` need a browser MCP not available here. | Web |
| Real photography or product screenshots | The page now has 3D, but no real product capture. Add when the app has a verified state to show. | Design |
| Day theme polish | Day works; the dim signals are faint on white. | Design |
