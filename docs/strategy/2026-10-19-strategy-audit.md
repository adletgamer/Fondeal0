# Fondealo: strategy, product and RWA audit

**Research date:** 2026-10-19 · **Repository audited:** `origin/main` @ `fd6ced0` (2026-10-12), read-only via git. Local `main` (`b7a8f49`) is 16 commits behind it. · **Live surfaces checked:** https://fondealo.vercel.app and https://www.fondealo.xyz (both serve the same build), logged out only.

**Labels:** **[E]** EVIDENCE (repo finding or cited source) · **[I]** INFERENCE · **[H]** HYPOTHESIS (needs validation) · **[L]** LEGAL REVIEW REQUIRED.

**Limits of this document.** This is not legal advice. I did not sign in to the live app, because creating an account on a production host is out of bounds, so I audited the authenticated screens from code only. I ran no tests, deployed nothing and changed no application code. Market figures come from secondary sources unless marked otherwise. Several claims could not be confirmed against a primary source; section 13 lists them.

---

## 1. Executive summary

1. **The product is shaped like a retail crowdlending marketplace, which is the most heavily regulated business Fondealo could pick in Peru.** The code and onboarding copy pitch businesses that borrow and "investors" who "fund vetted SMEs … and earn USDC returns" (`onboarding-flow.tsx:228`). Peru regulates loan crowdfunding (*financiamiento participativo financiero de préstamos*) under DU 013-2020 and SMV Res. 045-2021-SMV/02. Only an SMV-authorized Peruvian *sociedad anónima* may run it, with a minimum share capital of S/300,000, and the operator may not hold funds after a raise closes, guarantee returns, or invest in its own projects ([Garrigues](https://www.garrigues.com/es_ES/noticia/peru-emite-reglamento-actividad-financiamiento-participativo-financiero-o-crowdfunding)). Taking money from the public without SBS authorization is barred by art. 11 of Ley 26702 ([SBS](https://www.sbs.gob.pe/noticia/detallenoticia/idnoticia/2565)). **[E][L]**
2. **The engineering is more disciplined than the product strategy.** `origin/main` already holds an honest operating model, fail-closed financing gates, salted KYB commitments, a declaration-only evidence boundary (ADR-0010) and release gates. The live landing page labels its own sandbox status correctly. **[E]** The gap is not code quality. Nothing yet gives a customer a useful outcome: the operating model says no applicant can currently reach `PassportActive`. **[E]**
3. **Recommended position:** Fondealo as **verified-business-data and credit-infrastructure software sold to licensed funders** (factoring companies, *cajas*, fintech lenders, SMV-authorized crowdfunding platforms). The SME gets a free, reusable, consent-based Business Passport; the funder pays for verified, decision-ready files. No proprietary token. No retail investor marketplace operated by Fondealo. **[I]**
4. **Best Peru entry point:** onboarding and KYB of businesses that use invoice factoring. Factoring is large and active in Peru (S/30.5 bn of operations in 2022 ([La Cámara](https://lacamara.pe/tag/factura/?print=pdf)); invoices are registered with CAVALI ([El Peruano](https://elperuano.pe/noticia/201278-factoring-opcion-clave-para-el-financiamiento-de-las-mipymes))), and SMEs repeat KYB with every funder. **[E] for the market, [H] for repeat-KYB pain, which must be validated through interviews.**
5. **Stablecoins and tokenization: postpone.** I found no live, regulated PEN↔USDC Stellar anchor in Peru; the closest is VERSO's grant proposal to build one ([SCF](https://communityfund.stellar.org/project/verso-perus-first-regulated-stellar-anchor-dul)). **[E]** Keep Soroban as an attestation layer for the Passport (issuer-signed status plus a salted commitment), not as a money rail. **[I]**
6. **First three tasks** (section 10): (a) a Spanish-first rewrite of the public site and onboarding with the investor solicitation removed; (b) an application-status screen that gives a real next step instead of the "Verification review required" dead end; (c) a consent and data-use screen with a share-with-funder model. All three are small, reversible and need no new dependencies.

---

## 2. Current repository and product audit

### 2.1 Repository state

| Finding | Label |
|---|---|
| Local `main` is 16 commits behind `origin/main`. PRs #8–#16 (CI baseline, auth UX, underwriting gate, KYB evidence intake, marketing redesign) exist only on the remote. Run `git pull --ff-only` before any work. | [E] |
| `docs/dev-plan-2026-Q4.md` is untracked, dated 2026-10-08, and conflicts with the merged `docs/operating-model.md` and `docs/roadmap.md`. The dev plan says to deploy to Testnet now, upgrade to Protocol 29 and demo at Meridian. The merged roadmap says not to upgrade dependencies, deploy contracts or move value as a side effect, and gates each step. Pick one source of truth. | [E] |
| `.env` exists locally and is gitignored (`.gitignore:19`); it is not tracked. | [E] |
| Old bundles (`fondealo-*.bundle`), `_worktrees/` and `scrollcraft/` sit at the repo root (about 600 KB of bundles). This is housekeeping, not a blocker. | [E] |

### 2.2 Architecture (as built)

- **Monorepo:** pnpm + Turborepo. `apps/web` runs Next.js 15 (App Router, Server Actions), React 19 and Tailwind. `packages/ui` holds design-system primitives (Button, Card, Badge, Field, RiskBadge, AddressChip, TxStatus). `packages/types` holds zod domain types and collateral/ledger math with unit tests. `packages/sdk` holds the Stellar SDK 16 Passport and Escrow clients. `packages/database` holds Prisma 6 on Neon Postgres. `packages/soroban` holds three Rust contracts on soroban-sdk 27. **[E]**
- **Auth:** Privy email/OTP creates a Stellar embedded wallet on first login. The Privy JWT is verified server-side, and the role (Business/Investor) is stored write-once in `UserWallet`. Middleware only checks that the cookie exists; layouts and pages verify it. **[E]**
- **Money:** an append-only Postgres `LedgerEntry` "test ledger" (grants, faucet, fund, repay, collateral). It is not on-chain USDC. **[E]**
- **Contracts:** `business_passport` (non-transferable credential with freeze/revoke), `credit_score` (repayment-driven score with an "external funder" anti-gaming rule) and `loan_escrow` (band-based collateral, pro-rata payout, default seizure). They are tested in CI but **not deployed** (no contract IDs). **[E]**

### 2.3 Feature reality matrix

| Capability | Status | Evidence |
|---|---|---|
| Landing and marketing site | **Live** | Both domains serve the same build, with an honest capability table on the page. |
| Privy login + embedded Stellar wallet + role | **Live (Testnet wallet)** | `onboarding-flow.tsx`, `lib/auth/session.ts` |
| KYB intake (PE/CO/MX/BR/AR/CL tax-ID formats, representative, consent, declared evidence) | **Sandbox.** Format checks only. Submissions stay `Processing`. Uploads are disabled. | `lib/providers/kyb.ts`, ADR-0010 |
| Peru registry check | **Stub.** Returns `Unavailable`. | `lib/providers/kyb-server.ts` |
| Underwriting decision model + financing gate | **Partial.** The schema and `canRequestFinancing()` exist, but no reviewer UI or policy can produce an `Approved` decision. | `lib/underwriting/eligibility.ts`, operating-model |
| Business Passport (UI) | **Prototype.** Themeable card. Demo fallback data exists in `lib/data/opportunities.ts`. | `passport-v2.tsx`, `passport-studio.tsx` |
| Passport / score / escrow on-chain | **Not deployed** | README deployments table |
| Opportunity creation, funding, repayment | **Test ledger only.** New financing is gated off for sandbox KYB. | `lib/actions/opportunities.ts` |
| Stablecoin on/off-ramp | **Concept.** A faucet exists; the cash ramp and SEP-24 options are labeled "planned". | `lib/providers/funding.ts` |
| Spanish UI | **Absent.** `lang="en"`. `lib/i18n.ts` exists but nothing imports it. | `app/layout.tsx:72`, `git grep` |
| Agentic (x402/MPP) verification payments | **Concept** | `docs/strategy/business-onboarding-underwriting-agentic-payments.md` |

### 2.4 Technical debt and integration risks

- The toolchain is one major protocol behind (soroban-sdk 27 vs. the 28.x the Stellar docs recommend). The repo already treats the upgrade as a separately reviewed change. **[E]**
- The contract `init` does not require the admin's authorization, and `loan_escrow` reads the risk band without checking `is_active`. Both are already documented in the strategy doc and must be fixed before any deploy. **[E]**
- Stellar RPC `getEvents` keeps roughly 7 days of events, so a durable indexer is needed before any on-chain claim. **[E]** ([Stellar docs](https://developers.stellar.org/docs/build/guides/events/ingest))
- Middleware is presence-only. That is acceptable because the pages verify the session, but every new route must call `getSession()`. A test exists (`protected-pages.test.ts`). **[E]**
- `apps/web` "test" was a no-op on local main; `origin/main` adds Vitest suites. **[E]**

### 2.5 Security and privacy concerns

| Concern | Status |
|---|---|
| KYB PII lives in `KybSubmission.fields` (JSON) in Neon. The schema comment says "encrypted at rest in production", but there is no application-level encryption. | Open **[E]** |
| The unsalted `sha256(address, name, country, RUC)` commitment could be brute-forced because RUCs are enumerable. | Fixed for new submissions on `origin/main`; legacy rows need review **[E]** |
| `getBorrowerPassport` can fall back to a demo Passport | The operating model requires that `source: demo` never count as verified. Verify every caller fails closed. **[E]** |
| Existing `Open` or partially funded test opportunities may be stranded by the new gate | Release blocker R-13 **[E]** |
| ANPD obligations (registry of databanks, cross-border transfer of data to Neon/Privy/Vercel outside Peru, consent records) under Ley 29733 and DS 016-2024-JUS | Not addressed **[L]** ([gob.pe](https://www.gob.pe/institucion/anpd/normas-legales/6554453-16-2024-jus)) |

### 2.6 Reusable components and conventions

Reuse these: `@fondealo/ui` primitives (tokens, `Field` with accessible errors, `TxStatus`, `RiskBadge`), `DataSourceBadge` (labels where data comes from), the zod-validated server actions that derive identity only from the session, the append-only ledger, the `KYB_COUNTRIES` tax-ID rules, the fail-closed `canRequestFinancing`, and the docs discipline (concept / sandbox / Testnet / live labels). **[E]**

### 2.7 Dependencies that must not break

Privy session sync and role write-once (`session.ts`, `onboarding.ts`), the Prisma migrations order (underwriting migration before the evidence migration), ledger invariants (`ledger.test.ts`), the Soroban shared ABI crate, and the Vercel deploys from `main` with Neon pooled/unpooled URLs. **[E]**

---

## 3. Customer journey and UX/UI assessment

### 3.1 Current-state audit (Peruvian SME owner's view)

| # | Problem | Evidence | Impact |
|---|---|---|---|
| U1 | **No Spanish.** The whole product is in English for a Peru-first customer. | `lang="en"`; unused `i18n.ts`; live page text | Critical |
| U2 | **No concrete outcome on arrival.** The hero says "A business deserves a financial identity that travels." Nothing says what the owner gets (faster factoring? fewer documents? a better rate?) or what it costs (free?). | Live landing | High |
| U3 | **Wallet-first onboarding.** The first authenticated screen sells "One login creates a real Stellar wallet for you", not the business benefit. | Live `/onboarding` | High |
| U4 | **Dead end after applying.** KYB stays `Processing`, no reviewer exists, and the dashboard shows "Verification review required". The user has no next step, no timeline and no contact. | `business/page.tsx`, operating-model | Critical |
| U5 | **Credit semantics without a basis.** Risk bands A–E, collateral % and APR suggestions appear before any real underwriting exists, which suggests a financing decision. | `business/page.tsx`, `collateral-calculator-form.tsx` | High (trust and legal) |
| U6 | **Investor solicitation.** "Fund vetted SMEs … earn USDC returns." Nothing is vetted yet, and the copy promotes returns. | `onboarding-flow.tsx:228` | Critical **[L]** |
| U7 | **The marketplace cannot be previewed.** Logged-out visits to `/invest/market` redirect to `/onboarding`, although code comments describe the marketplace as public. | Live check | Low (the intent should be decided, not fixed blindly) |
| U8 | **Long, decorative mobile page.** The landing page is about 7,900 px tall at 375 px wide. 61 text nodes are under 12 px (mono labels). | JS measurement on the live site | Medium (accessibility) |
| U9 | **Effort on Passport looks over data.** Five themes plus custom colors exist, while consent, data-use and status screens do not. | `passport-studio.tsx` | Medium (prioritization) |
| U10 | **The consent model is unclear.** Users are not told who sees their data, what is public versus off-chain, or how to revoke sharing. | KYB wizard copy | High (trust and ANPD) |

**What works:** the honest capability table on the landing page; the "Illustrative / specimen / no customer data" labels; KYB errors that use country-specific RUC hints; sandbox labeling; session retry and recovery states. **[E]**

### 3.2 Prioritized improvements

| Rank | Improvement | Customer impact | Effort |
|---|---|---|---|
| 1 | Spanish-first copy across the public site, onboarding and KYB; English as secondary | Very high | M |
| 2 | Application status with a real next step: states, expected time, what is missing, how to contact a human, what happens if the application is rejected | Very high | S–M |
| 3 | Consent and data-use screen: what is collected, why, where it is stored, who can see it, share-with-funder toggles, revoke | High | S–M |
| 4 | Remove or quarantine the investor role and the A–E/collateral/APR UI from the public and default flows until a licensed-partner model exists | High (risk reduction) | S |
| 5 | Outcome-led landing page: "Verifica tu empresa una vez. Compártela con quien te financia." Show three steps and the price (free for SMEs) | High | M |

### 3.3 Improved customer journey

```
Descubre (landing ES) → Crea cuenta (email/OTP; wallet created silently, never mentioned)
→ Datos de la empresa (RUC first; autofill name/status when an authorized source exists)
→ Representante + consentimiento explícito (purpose, retention, ANPD rights)
→ Evidencia (declare now; upload later when ADR-0010 gates pass)
→ Estado de solicitud (Recibida → En revisión → Falta información | Verificada | No verificada + motivo + apelación)
→ Pasaporte verificado (facts with source and date; no score)
→ Compartir con un financiador (partner list; per-partner consent; revocable; access log)
→ Resultado del financiador (shown as the partner's decision, never Fondealo's)
```

### 3.4 Proposed information architecture

```
/                      Inicio (ES) · /en (secondary)
/como-funciona         3 pasos + qué datos y por qué
/financiadores         For partners: API/file, pricing, pilot contact
/estado                Product truth table (existing section, own page)
/app                   (authenticated, business only by default)
  /app/solicitud       KYB intake (existing wizard, Spanish)
  /app/estado          Application status + next step  ← new
  /app/pasaporte       Verified facts + share log
  /app/compartir       Consent per funder  ← new
  /app/cuenta          Profile, data rights (access/rectify/delete), sign out
/partner (later)       Funder console: received files, decisions
```

`/invest/*` and `/business/new` stay behind a feature flag (Testnet/demo only) until a licensed operating model exists.

### 3.5 Wireframe-level descriptions

**A. `/app/estado` (Application status)**
- Header: business name, RUC, status chip (`En revisión`) with the date it was submitted.
- A vertical stepper with 5 steps (Recibida, Identidad, Revisión, Verificada, Compartible). The current step is expanded with "Qué estamos revisando" and "Tiempo estimado: X días hábiles" (shown only once real SLAs exist; otherwise "Sin plazo definido — modo de prueba").
- A "Necesitamos de ti" card, shown only for `NeedsInformation`, with a specific item and a single CTA.
- A rejection card with a plain-language reason code, how to correct the issue, a resubmit option and a human contact.
- A footer note: "Verificar tu empresa no significa que recibirás financiamiento."

**B. Consent / share (`/app/compartir`)**
- A table with these columns: Dato · Para qué · Dónde se guarda · Quién lo ve. Rows: RUC, razón social, representante, documentos, historial de pagos.
- Funder cards: name, license type (with a link to the regulator's registry), what they will receive, a "Compartir" toggle and the last access date.
- "Revocar todo" and "Descargar mis datos" actions.

**C. Landing hero (mobile first)**
- H1: "Verifica tu empresa una vez. Compártela con quien te financia."
- Subtitle: "Gratis para MYPEs. Tú decides quién ve tu información."
- A primary CTA ("Empezar con mi RUC") and a secondary one ("Soy financiador").
- A three-step strip, then the existing truth table. No 3D scroll above the fold on mobile, and reduced motion is respected.

### 3.6 Design-system plan

- Add an `i18n` layer (start with the existing dictionary pattern and `next-intl` only if routing needs it; flag any new dependency for approval). Set `lang="es-PE"`.
- Add a `StatusStepper`, a `ConsentRow`, a `ReasonCode` alert and a `DataProvenance` chip (source + date) to `@fondealo/ui`.
- Set a minimum of 12 px for body/label text and 14 px for actionable text. Check contrast on the night theme (WCAG AA). Keep mono only for identifiers.
- Introduce a vocabulary rule: never "score", "aprobado" or "vetted" without a decision record; prefer "verificado por [fuente] el [fecha]".

### 3.7 Acceptance criteria (for items 1–5)

1. **Spanish:** every public and onboarding string comes from the dictionary; `lang` is `es-PE`; an automated check fails on hard-coded English strings in those routes; native-speaker review is signed off.
2. **Status:** every `KybStatus`/decision state renders a distinct screen with a next action; a DB outage renders "No pudimos cargar tu estado" (no blank or redirect loop); tests cover each state.
3. **Consent:** consent text is versioned and stored with a timestamp; nothing is shared with a third party without an active consent row; revocation is recorded in `VerificationAuditEvent`.
4. **Quarantine:** with the flag off, `/invest/*` returns 404 and no "returns"/"vetted"/APR copy is reachable; existing obligations remain accessible to their owners.
5. **Landing:** Lighthouse a11y ≥ 95 on mobile; no text under 12 px; LCP under 2.5 s on 4G throttle.

### 3.8 Testing plan with SMEs

- **Recruit:** 8–12 Lima and regional MYPE owners who used factoring or bank or *caja* credit in the last 12 months (through CCL, accountants or a factoring partner), plus 3–5 credit or risk analysts at funders.
- **Method:** 45-minute moderated sessions. The SME does a first-click/5-second test on the landing page, completes KYB on Testnet with synthetic data (never their real RUC until consent and storage gates pass), then explains the status and share screens in their own words.
- **Measures:** whether the value proposition is understood (answers "¿qué gano?" correctly), intake completion, time to submit, fields that cause doubt, trust rating, and willingness to share with a named funder. For funders: which fields they re-verify, time per KYB file today, and willingness to pay.
- **Assumptions to test [H]:** repeat KYB across funders is painful; SMEs trust a non-bank to hold their file; funders will accept third-party verification under their own AML duties.

---

## 4. Competitive RWA comparison

Research date 2026-10-19. Figures are from cited (often secondary) sources and are not audited.

| Company | Core product · customer · asset | Business model (public evidence) | Legal right / regulatory approach | Settlement · distribution · trust | Strengths / weaknesses | Lesson for Fondealo |
|---|---|---|---|---|---|---|
| **Securitize** | Transfer agent and broker-dealer infrastructure for tokenized funds (BlackRock BUIDL, Apollo, KKR feeders); institutional issuers | Q1-26 revenue $19.5M, of which asset servicing was $8.3M; FY-26 guidance about $110M ([KuCoin flash](https://www.kucoin.com/news/flash/securitize-reports-19-5m-q1-revenue-plans-nasdaq-listing-via-spac-merger)); listed via SPAC on 2026-07-02 ([Cointelegraph](https://regional-front.cointelegraph.com/news/securitize-gets-sec-nod-cantor-merger-nyse-listing)) | Tokens are registered securities and fund interests; SEC-registered intermediaries | Stablecoin and fiat subscriptions; distribution through asset managers | Moat is regulatory licenses plus issuer relationships; it is not retail | **The money is in being the licensed servicing layer, not in the token.** |
| **Ondo Finance** | Tokenized Treasuries (OUSG for qualified purchasers, USDY for non-US holders); tokenized stocks via a BVI issuer | Management fees on AUM; about $3.8B on-chain AUM per DefiLlama ([DefiLlama](https://defillama.com/rwa/platform/ondo)) | Note or fund structures with jurisdictional exclusions (US persons excluded from USDY) | Mint/redeem in stablecoins; DeFi integrations | Product–market fit with crypto-native treasuries; heavy geo-restrictions | Yield on safe assets works; **SME credit is not that product.** |
| **Centrifuge** | Tokenization stack; now mostly institutional funds (Janus Henderson Anemoy JTRSY, JAAA CLO) ([tradingstrategy](https://tradingstrategy.ai/vaults/janus-henderson-anemoy-treasury-fund-6)) | Protocol and fund fees | SPV per pool; issuer-dependent | Stablecoin vaults | Pivoted from SME and receivables pools toward Treasuries and CLOs (inference from the current product mix; loss history not verified) | **The early SME-receivables pools were not where scale came from.** |
| **Figure** | HELOC origination on its Provenance chain; licensing of its loan-origination system to partners | H1-25 revenue $191M, net income $29M; IPO 2025-09 ([SiliconANGLE](https://www.siliconangle.com/2025/09/11/shares-blockchain-company-figure-climb-21-787m-ipo/)) | Licensed US lender; the chain is a ledger for loans that are legally enforceable off-chain | Fiat | A real lender using blockchain to cut cost; the 40→10-day speed claim is company-reported | **Blockchain as back-office efficiency inside a licensed lending business.** |
| **Maple** | Overcollateralized institutional crypto-backed loans; syrupUSDC | AUM about $4.6B per the H1-26 memo ([Maple](https://maple.finance/insights/maple-memo-july-2026)) | Pivoted after the 2022 Orthogonal default (about $36M) to secured loans with roughly 170% collateral | USDC/USDT | Survived by abandoning reputation-based lending | **Reputation alone does not secure credit; collateral and underwriting do.** |
| **Huma** | "PayFi": receivables, card and cross-border payment financing; liquidity in USDC | H1-26: $6.68M in protocol fees on $14.96B cumulative volume (company-linked report) ([Blockworks](https://blockworks.com/api/investor-report/huma-finance-protocol-report-h1-2026/pdf)) | Short-duration receivables via originating partners | USDC on Solana and Stellar | Self-liquidating, short-tenor assets; depends on originators | **Short receivables fit stablecoin liquidity better than term SME loans.** |
| **Paxos (PAXG)** | Gold token, 1 token = 1 troy oz of allocated London Good Delivery gold | Issuer and custody fees | Issued by a NYDFS-regulated trust; monthly attestations ([Paxos](https://paxos.com/paxgold/)) | Redeemable for bars or USD | Trust comes from the regulated issuer, audits and redemption | **Commodity tokens need a regulated custodian and redemption: no fit for Fondealo.** |
| **Tether Gold (XAUt)** | Swiss-vaulted gold token | Issuer fees | Weaker transparency per third-party view; physical redemption reportedly 430 oz and Swiss delivery (unverified) ([bit.com](https://www.bit.com/zh/knowledge-hub/tokenised-gold)) | Mostly secondary-market exit | Liquidity without easy redemption | Avoid redemption terms that exist only on paper. |
| **Mercado Bitcoin / Brazil tokenized receivables** | Brazilian exchange tokenizing fixed income and receivables | Fees on issuance and trading | The CVM treats receivables and fixed-income tokens as securities; it recommends the crowdfunding regime plus a securitizer ([InfoMoney](https://www.infomoney.com.br/?p=2179059)) | BRL | Proves LatAm demand, under securities rules | **In LatAm, tokenized SME credit = securities law.** |
| **RealT** | Fractional Detroit rental tokens, retail | Fees and markups | LLC per property; Detroit's 2025 blight lawsuit over 400+ properties ([WDET](https://wdet.org/2025/07/03/detroit-suing-blockchain-based-real-estate-firm-for-neglecting-hundreds-of-properties/)); 2026 liquidation reported (unverified) | Stablecoin rents | Servicing failures sank the model | **Off-chain operations decide outcomes; the token cannot fix them.** |
| **Goldfinch** | Uncollateralized emerging-market credit via "backers" | — | Wound down in 2026 (GIP-87); reported losses of about 70% (single source) ([The Defiant](https://thedefiant.io/news/defi/goldfinch-finance-winds-down-depositors-report-50m-defaults)) | USDC | Cross-border, reputation-led credit failed | **The closest analogue to Fondealo's original model, and it failed.** |
| **Peru incumbents** (factoring platforms such as Fináncialo/Factorízalo; SMV-authorized FPF platforms) | SME invoice and working-capital finance in PEN/USD | Discount and fees; Factorízalo plans more than US$1.2B of invoices in 2026 ([CCL](https://lacamara.pe/factorizalo-planea-financiar-us-1200-millones-en-facturas-en-2026-cual-es-su-estrategia-ccl-asociados/)) | SBS factoring registry (Ley 30308) or an SMV FPF license | Bank rails, CAVALI | They own origination and licenses | **They are Fondealo's customers, not its competitors.** |

### Strategic synthesis

- **Strongest evidence of product–market fit:** tokenized Treasuries and money-market funds (Ondo, BUIDL via Securitize), institutional overcollateralized lending (Maple), and licensed lenders using a chain internally (Figure). Uncollateralized or retail SME credit (Goldfinch, early Centrifuge/Credix-type pools, RealT) has the weakest record. **[I]**
- **Infrastructure vs. distribution:** Securitize, Centrifuge, Paxos and Figure's Provenance licensing are infrastructure. Ondo, RealT and Maple distribute products directly. **[I]**
- **Defensibility comes from** licenses and regulated roles, origination relationships, servicing and collections, data quality with provenance, and redemption that actually works. It does not come from token issuance. **[I]**
- **What builds trust:** a regulated issuer or custodian, independent attestations, enforceable legal rights off-chain, working redemption, and transparent losses. **[E]** (PAXG, Maple post-2022)
- **Realistic for a low-capital, Peru-first startup:** software and data infrastructure for licensed funders (Model C). Everything that holds money or issues securities needs licenses or partners Fondealo does not have. **[I]**
- **Underserved in LatAm:** reusable, consented KYB and business-fact files shared across funders; regional *caja* and factoring onboarding outside Lima (Factorízalo cites the regional credit gap); and verification once SBS open finance arrives (the rule calendar reportedly starts in 2028). **[H]**

---

## 5. Latin American regulatory and market analysis

**[L] applies to this whole section.** It separates current law, guidance and proposals, but every conclusion needs Peruvian counsel.

### 5.1 Peru by activity

| Activity | Relevant authority / rule | Status | What it likely means for Fondealo |
|---|---|---|---|
| **A. Business identity / KYB data** | ANPD (Ley 29733; new regulation DS 016-2024-JUS, published 2024-11-30) ([gob.pe](https://www.gob.pe/institucion/anpd/normas-legales/6554453-16-2024-jus)) | **Binding law.** The effective date (reportedly 2025-03-30) is from a secondary source. | Consent, purpose limitation, databank registration and cross-border transfer rules. SUNAT has no open third-party RUC API; the public portal uses a CAPTCHA, and scraping is excluded by ADR-0010 ([search summary](https://cpe.sunat.gob.pe/node/158)). |
| **B. Credit information / scoring** | Ley 27489 (CEPIRS), amended by Ley 31944; the SBS Central de Riesgos feeds the CEPIRS ([Ley 31944](https://busquedas.elperuano.pe/dispositivo/NL/2238699-2)) | **Binding law.** Authorization and supervision for CEPIRS is **unclear** (sources conflict). | Selling credit reports or scores to third parties may make Fondealo a CEPIRS. **Start with verified facts that the SME itself shares, not a Fondealo score.** |
| **C. Loan intermediation / crowdfunding** | SMV: DU 013-2020 Title IV; Res. 045-2021-SMV/02, amended by Res. 019-2025-SMV/01 ([El Peruano](https://busquedas.elperuano.pe/dispositivo/NL/2495070-1)) | **Binding.** Few active platforms; SMV revoked Afluenta Perú ([Gestión](https://gestion.pe/economia/empresas/revocan-autorizacion-de-la-plataforma-de-crowdfunding-afluenta-peru-noticia/)). | The current investor marketplace is likely **FPF de préstamos** and needs an SMV license (S/300k capital, a two-stage authorization, no custody after close, no guaranteed returns). Invoice discounting and factoring are **excluded** from FPF. |
| **C′. Deposit-taking** | SBS, Ley 26702 art. 11; criminal *captación ilegal* | **Binding** | The ledger "deposit/faucet → fund" pattern with real money would risk being unauthorized deposit-taking. |
| **C″. Factoring** | SBS Registry of Factoring Companies (Ley 30308); Ley 29623 *factura negociable*; CAVALI registry ([vLex](https://vlex.com.pe/vid/ley-n-30308-ley-562278846)) | **Binding** | The partner segment for Fondealo. A factoring company is a registrant; Fondealo as a software vendor is not (**[L]** confirm). |
| **D. Stablecoin exchange / transfer / custody** | UIF-Perú/SBS: DS 006-2023-JUS; Res. SBS 02648-2024 (PSAV AML/CFT) ([CMS](https://cms.law/en/per/publication/aprueban-la-norma-para-la-prevencion-del-lavado-de-activos-y-del-financiamiento-del-terrorismo-aplicable-a-los-proveedores-de-servicios-de-activos)) | **Binding** (AML registration and reporting, not prudential licensing); the "Ley Marco de Comercialización de Criptoactivos" passed committee on 2026-07-31 ([Diario Judicial](https://www.diariojudicial.com/news-95343-peru-mas-cerca-de-su-ley-cripto)) | Exchanging, transferring or custodying for others makes Fondealo a PSAV with SPLAFT duties. **Use a registered PSAV partner; Fondealo should not touch the funds.** |
| **E/F. Tokenized debt / security tokens** | SMV securities law; no tokenization rule; SMV is evaluating a sandbox (Agenda Temprana 2026–27) ([Chambers](https://gpg-pdf.chambers.com/fintech-2026/616/)) | **Guidance / proposal** | A token carrying repayment rights offered to the public is very likely a security. Not viable at this stage. |
| **G. Commodity-backed tokens** | No specific regime found | **Gap** | No strategic fit. Do not pursue. |
| **H. Secondary trading / solicitation** | SMV (public offering rules); Indecopi (consumer advertising) | **Binding** | Copy such as "earn USDC returns" aimed at the public is a solicitation risk now, even on Testnet. |
| **Open finance** | SBS General Open Finance Regulation pre-published (Res. SBS 02433-2026, reported); consultation until 2026-10-23; data exchange reportedly from 2028 ([MobileTime](https://mobiletime.la/tag/sbs/), [El Peruano](https://www.elperuano.pe/noticia/298694-sbs-anuncia-que-publicara-en-julio-reglamento-del-baas-y-a-inicios-del-2027-la-norma-del-open-finance)) | **Proposal** | Likely a new "data-based service provider" role. **Monitor and consider commenting; it could become Fondealo's licensed lane.** |

### 5.2 Comparator jurisdictions (summary; verify before relying)

| Country | Crowdlending | Crypto / stablecoins | Note |
|---|---|---|---|
| **Brazil** | CVM Res. 88: up to R$15M/year per issuer and R$20k/year per retail investor; receivables tokens are securities | BCB Res. 519/520/521 (effective 2026-02-02); stablecoin transfers treated as FX ([Cointelegraph](https://cointelegraph.com/news/brazil-central-bank-crypto-rules-stablecoins-foreign-exchange)) | The most mature market and the strictest securities treatment. |
| **Mexico** | Ley Fintech: CNBV-authorized IFCs (19 with definitive approval per a May-2026 report) | Banxico-restricted | Licensing is slow; a partnership is required. |
| **Colombia** | Collaborative financing under the Superfinanciera (the decree number in sources varies, 1357/2018) | — | Deposit-taking risk is the core issue. |
| **Chile** | Ley Fintec 21.521 + CMF NCG 502 | Registry-based | Registration regime; the closest analogue to Peru for factoring. |

**Recommended operating model: staged** **[I][L]**

| Model | Time/cost | Regulatory complexity | Partners | Revenue | Fit now |
|---|---|---|---|---|---|
| Data and credit-infrastructure provider (KYB files, verified facts) | Low | Medium (ANPD; CEPIRS question) | Funders | SaaS/API | **Yes: start here** |
| Technology provider to licensed institutions (white-label onboarding) | Low–Medium | Low for Fondealo; the partner holds the license | Factoring, *cajas*, FPF platforms | Licensing, per-file fees | **Yes, in parallel** |
| Referral marketplace to independent funders | Medium | Medium (advertising, possible intermediation) | Several funders | Referral fees (**[L]**: may be restricted) | Later, after legal review |
| Regulated partner originates/distributes; Fondealo powers it | Medium | Partner-borne | One SMV/SBS entity | Revenue share | After pilot evidence |
| Fondealo as FPF operator or tokenized-debt arranger | High (S/300k+, compliance staff) | High | — | High in theory | **No, not at this stage** |

---

## 6. Stablecoin opportunity assessment

| Use case | Real pain? | Rails today in Peru | Verdict |
|---|---|---|---|
| Disbursing SME loans in USDC | SMEs pay in PEN (or USD via banks); USDC adds an off-ramp step | No live regulated Stellar PEN anchor (VERSO proposal only) | **No** |
| Repayment collection in USDC | Same problem | Same | **No** |
| Cross-border supplier payments / exporter receivables | Plausible for importers and exporters **[H]** | Registered PSAVs (e.g., VERSO self-reports UIF registration) | **Validate in interviews only** |
| Treasury for institutional funders | Possible for foreign capital funding Peruvian factoring **[H]** | Partner-dependent; FX, tax and BCRP aspects | **Later** (Phase 3) |
| Escrow / collateral | `loan_escrow` exists, but holding collateral for others is custody | — | **No** for real money |
| Paid verification calls (x402/MPP) | An internal cost line, not a customer pain | Testnet | Small R&D spike only, as the repo already scopes it |

**Wallet-first vs. abstracted:** keep the Privy wallet invisible. Users see soles, fees, status and confirmations in Spanish, never seed phrases or XLM. The wallet exists only to anchor a Passport credential if and when one is issued. **[I]**

**Smallest viable pilot (only if interviews validate the cross-border case):** one funder, one registered PSAV partner, a USD/USDC disbursement of at most a few thousand dollars on synthetic or consenting test businesses, where Fondealo only displays status. Fondealo holds no keys and no funds. **[H][L]**

---

## 7. Token-model comparison

| Criterion | A. Tokenized debt / security | B. Commodity-backed | **C. Infrastructure, no token** | D. Tokenized receivables records |
|---|---|---|---|---|
| Customer problem solved | Investor access to SME yield | None for SMEs | Repeat KYB, slow onboarding, lack of verified data | Faster factoring settlement and traceability |
| Evidence of demand | Brazil shows it exists under CVM rules | None for Fondealo | **[H]**, testable in weeks | **[H]** |
| Fit with Passport / Reputation | Indirect | None | **Direct** | Strong later |
| Regulatory complexity | Very high (SMV securities/FPF) | High; no regime | Medium (ANPD/CEPIRS) | High (Ley 29623 assignment, CAVALI) |
| Capital / operating cost | High | High (custody, audits) | **Low** | Medium–High |
| Licensed partners needed | Yes | Yes (custodian) | Optional | Yes (factoring co. + CAVALI) |
| Custody / redemption | Required | Required | None | Legal title stays off-chain |
| Reputation risk | High | High | **Low** | Medium |
| Time to responsible pilot | 18–36 months **[H]** | n/a | **1–3 months** **[H]** | 12+ months **[H]** |
| Defensibility | Licenses | Custodian brand | Data network + funder integrations | Origination + registry links |
| **Verdict** | Postpone | **Do not build** | **Build now** | Research only, with a partner |

**Prerequisites before Model D:** a named factoring partner; counsel's opinion on whether an on-chain record has any legal effect next to the CAVALI *factura negociable* (it most likely mirrors title rather than holding it); a servicer and collections process; investor eligibility; and a disclosure and default playbook. Smart contracts come last. **[L]**

---

## 8. Recommended business model and positioning

**Positioning (ES):** *"Fondealo verifica a tu empresa una vez y te deja compartir ese expediente, con tu permiso, con los financiadores que elijas."*
**Positioning (EN):** reusable, consented business verification and credit files for Latin American SME finance.

| Question | Answer |
|---|---|
| Build now | Spanish-first onboarding, the status and consent screens, a funder-facing verified file (PDF/JSON export plus a simple partner view), and an audit log **[I]** |
| Validate before building | Repeat-KYB pain, funders' willingness to pay, which fields funders accept from a third party, and authorized RUC/registry data sources **[H]** |
| Postpone | Testnet escrow deploy, stablecoin flows, agentic payments, protocol upgrade (unless needed for a Passport attestation pilot), score display **[I]** |
| Do not build | A Fondealo-run retail investor marketplace, a proprietary/utility token, commodity tokens, custody of user funds **[I][L]** |
| Entry product | Free Business Passport for SMEs; paid verified files for funders **[H]** |
| Who pays | Factoring companies, *cajas*/*financieras*, fintech lenders and FPF platforms, per verified file or by subscription **[H]** |
| Measurable value | Funder: KYB minutes and cost per file, drop-off, fraud flags caught. SME: time to submit a second application, number of funders reached **[H]** |
| Recurring revenue | Annual funder subscriptions with per-file overage; refresh fees for re-verification when a file expires (`ReviewDue`) **[H]** |
| Required partners | One design-partner funder, an authorized data provider (registry/AML screening), counsel, later a PSAV **[I]** |
| Defensible over time | A consented network of verified SMEs with refresh history plus funder-reported repayment events (with consent), which becomes the credit-reputation layer legitimately **[H][L]** |
| How later products reinforce it | Repayment events from partners feed reputation; reputation lowers partners' cost; open finance (2028+) adds bank data; receivables records (D) become possible once partners trust the data **[I]** |
| Smallest proof of demand | Three funders sign a paid pilot letter, and 30 SMEs complete intake and consent to share **[H]** |

Fondealo publishes no revenue forecasts. Price discovery happens in funder interviews (see section 11).

---

## 9. Prioritized roadmap

This complements the repo's Stage 0–6 gates in `docs/roadmap.md`; it does not replace them.

| Phase | Objective | Deliverables | Dependencies | Complexity | Key risks | Success metrics | Go / no-go to next phase |
|---|---|---|---|---|---|---|---|
| **0. Understand** (now–4 wks) | Validate the problem and the buyer | 12 SME + 5 funder interviews; a legal scoping memo (FPF, CEPIRS, ANPD, PSAV); reconcile the dev-plan vs. operating-model docs; pull `origin/main` | Counsel budget; recruiting channel | Low | Confirmation bias | ≥3 funders describe repeat-KYB cost; ≥1 willing to pilot | Go if a pilot letter is signed and counsel finds no blocker for the software-vendor role |
| **1. Improve product** (4–10 wks) | A useful, trustworthy SME journey | Section 10 tasks; quarantine the investor flow; consent; status; a11y | Phase 0 copy decisions | Medium | Scope creep into chain work | Intake completion ≥60%; value prop understood by ≥80% of testers | Go if SMEs complete intake and agree to share |
| **2. Validate financing workflow** (8–16 wks) | Real files flow to one funder | Authorized data source; manual reviewer UI (Stage 2 of the repo roadmap); file export; partner view; ANPD registration | Data vendor contract; partner agreement | Medium–High | Data-source access; reviewer liability | Files accepted without re-collection; minutes saved per file | Go if the partner pays or renews and decision quality is measured |
| **3. Stablecoin pilot** (only if validated) | One cross-border flow | A PSAV-partnered pilot where Fondealo shows status only | Validated use case; PSAV partner; legal memo | Medium | FX/tax/AML | Settlement time and cost vs. the bank baseline | Go only if it is clearly better for a named customer |
| **4. RWA evaluation** | Decide on Model D | A legal-rights memo; partner MoU; demand from buyers | Factoring partner + CAVALI view | High | Securities characterization | Signed demand from capital providers | No issuance without specialist counsel and a regulated partner |
| **5. Scale** | A second funder type, then a second country (Chile/Colombia) | Country adapters (KYB rules already exist for 6 countries) | Proven unit economics | High | Multi-jurisdiction compliance | Retention of funders; files per SME | Expand only with per-country legal review |

---

## 10. First three implementation tasks (awaiting approval)

| # | User problem | Files | Smallest safe change | Acceptance | Tests |
|---|---|---|---|---|---|
| **1. Spanish-first public + onboarding copy, investor solicitation removed** | Peruvian SMEs cannot read the product; the investor copy is a legal risk | `app/layout.tsx`, `app/page.tsx`, `components/onboarding-flow.tsx`, `components/kyb-wizard.tsx`, `lib/i18n.ts`, `components/navbar.tsx` | Extend the existing `dictionary` (no new dependency); `lang="es-PE"`; ES default plus an EN toggle; replace the investor card copy with neutral "Soy financiador → contáctanos", or hide it behind a flag | Section 3.7 (1) and (4); no "earn"/"vetted"/"returns" strings reachable | Snapshot or string tests on the onboarding cards; existing `onboarding-flow.test.ts` updated |
| **2. Application-status screen with a next step** | The dashboard is a dead end after KYB | `app/business/page.tsx`, `lib/data/kyb.ts`, new `components/application-status.tsx`, `packages/ui` (StatusStepper) | Render a distinct state for `Processing / NeedsInformation / Rejected / Accepted / DB error`; add a "No significa financiamiento" notice and a human contact link; hide the A–E band, collateral and APR tiles unless a real decision exists | Section 3.7 (2) | Unit tests per state using the existing `prisma-mock.ts` |
| **3. Consent and data-use page** | Users don't know who sees their data (ANPD duty) | New `app/business/datos/page.tsx`, reuse `VerificationAuditEvent`, `lib/actions/evidence.ts` | A read-only table of collected fields with purpose, storage and visibility; consent version and timestamp shown; a "solicitar eliminación" request that records an audit event (no deletion automation yet) | Section 3.7 (3); copy reviewed by counsel before production | Action test that a session-less or wrong-role request fails closed |

All three are UI or copy changes on existing data with no new dependencies, contracts, migrations or money movement. Task 3 may need a later migration if consent versions are not already stored; if so, I will stop and ask. **Prerequisite:** fast-forward local `main` to `origin/main` and work on a feature branch.

---

## 11. Success metrics and validation experiments

| Experiment | Hypothesis | Method | Pass threshold (proposed) |
|---|---|---|---|
| Funder pain interviews | KYB re-collection costs funders meaningful time and money | 5 funders: time per file, fields re-verified, current vendors | ≥3 quantify the cost; ≥1 signs a pilot letter |
| Price test | Funders pay per verified file | Van Westendorp or a direct-offer letter | A price range covering data-vendor costs + margin |
| SME landing test | The ES outcome-led hero is understood | 5-second test, n≥10 | ≥80% state the benefit correctly |
| Intake usability | The SME can finish in under 10 minutes | Moderated sessions with synthetic data | ≥60% completion; ≤2 blocking confusions |
| Willingness to share | SMEs will share files with a named funder | Share-consent prototype | ≥50% opt in for at least one funder |
| Data-source feasibility | An authorized RUC/registry/AML source exists at workable cost | Vendor RFIs | ≥1 compliant source with terms that allow resale/sharing |

Track operational metrics only after instrumentation exists, consistent with the operating model: intake completion, review time, NeedsInformation rate, files shared, funder acceptance and re-verification rate.

---

## 12. Risks, open questions, required consultations

| Item | Type | Who to consult |
|---|---|---|
| Does any current flow amount to FPF, deposit-taking or solicitation, even on Testnet with the public site live? | **[L]** urgent | Peruvian fintech/securities counsel |
| Is Fondealo a CEPIRS if it shares verified facts or repayment events? Which authority supervises CEPIRS? | **[L]** | Data-protection + financial counsel |
| ANPD: databank registration, international transfer (Neon/Privy/Vercel), consent wording, retention periods | **[L]** | Privacy counsel |
| Can a software vendor process KYB for SBS-supervised or AML-obliged funders? Does reliance on third-party KYB satisfy their SPLAFT duties? | **[L]** | AML counsel + partner compliance |
| Authorized SUNAT/SUNARP data access (no open API found) | Operational | Data vendors; SUNAT |
| Open-finance consultation (reportedly closes 2026-10-23): comment or not | Strategic | Counsel; Asociación Fintech Perú |
| Docs divergence: the untracked dev plan vs. the merged operating model | Process | Founders / CTO |
| Existing test opportunities and balances (R-13) | Operational | Engineering (per repo gates) |
| Brand "Business Passport" vs. state-issued identity: risk of implying official status | Reputational **[L]** | Counsel / marketing |

---

## 13. Sources, dates and evidence quality

**Repository (primary, read 2026-10-19):** `origin/main` `fd6ced0`: `docs/operating-model.md`, `docs/roadmap.md`, `docs/risks.md`, `docs/adr/0010-kyb-evidence-boundary.md`, `docs/strategy/business-onboarding-underwriting-agentic-payments.md`, `apps/web/src/**`, `packages/database/prisma/schema.prisma`. Local untracked `docs/dev-plan-2026-Q4.md`. Live sites checked logged out on 2026-10-19.

**Regulatory sources (Peru):**
- DU 013-2020 / SMV FPF rules: [El Peruano 2495070](https://busquedas.elperuano.pe/dispositivo/NL/2495070-1), [Garrigues summary](https://www.garrigues.com/es_ES/noticia/peru-emite-reglamento-actividad-financiamiento-participativo-financiero-o-crowdfunding), [Afluenta revocation, Gestión](https://gestion.pe/economia/empresas/revocan-autorizacion-de-la-plataforma-de-crowdfunding-afluenta-peru-noticia/). Primary text plus a law-firm summary; medium-high quality.
- Ley 26702 art. 11: [SBS notice](https://www.sbs.gob.pe/noticia/detallenoticia/idnoticia/2565). Primary.
- PSAV AML: [CMS on Res. SBS 02648-2024](https://cms.law/en/per/publication/aprueban-la-norma-para-la-prevencion-del-lavado-de-activos-y-del-financiamiento-del-terrorismo-aplicable-a-los-proveedores-de-servicios-de-activos), [SBS bulletin](https://www.sbs.gob.pe/boletin/detalleboletin/idbulletin/2282). Law-firm summary plus primary.
- Data protection: [ANPD DS 016-2024-JUS](https://www.gob.pe/institucion/anpd/normas-legales/6554453-16-2024-jus). Primary. The effective date is from a secondary source only.
- CEPIRS: [Ley 31944, El Peruano](https://busquedas.elperuano.pe/dispositivo/NL/2238699-2). Primary. The supervisory authority is **unverified**.
- Factoring: [Ley 30308, vLex](https://vlex.com.pe/vid/ley-n-30308-ley-562278846), [El Peruano on factoring](https://elperuano.pe/noticia/201278-factoring-opcion-clave-para-el-financiamiento-de-las-mipymes). Medium.
- Crypto bill: [Diario Judicial, 2026-07-31](https://www.diariojudicial.com/news-95343-peru-mas-cerca-de-su-ley-cripto). Secondary; plenary status unverified.
- Open finance / BaaS: [El Peruano](https://www.elperuano.pe/noticia/298694-sbs-anuncia-que-publicara-en-julio-reglamento-del-baas-y-a-inicios-del-2027-la-norma-del-open-finance), [MobileTime](https://mobiletime.la/tag/sbs/). Res. SBS 02433-2026 is reported via a LinkedIn post and is **unverified**.
- SMV sandbox agenda: [Chambers Fintech 2026](https://gpg-pdf.chambers.com/fintech-2026/616/). Secondary.
- MYPE credit access: [Infobae / IPE, 2026-03-24](https://www.infobae.com/peru/2026/03/24/solo-1-de-cada-4-mypes-accede-a-credito-y-paga-mas-por-falta-de-informacion-financiera/). Press; the figures measure different things.
- SUNAT API: [SUNAT CPE node](https://cpe.sunat.gob.pe/node/158). No open third-party RUC API was found.
- Stellar PEN anchor: [VERSO SCF page](https://communityfund.stellar.org/project/verso-perus-first-regulated-stellar-anchor-dul). Self-reported grant proposal.

**Comparator jurisdictions:** [BCB Res. 519–521, Cointelegraph](https://cointelegraph.com/news/brazil-central-bank-crypto-rules-stablecoins-foreign-exchange); [CVM on receivables tokens, InfoMoney](https://www.infomoney.com.br/?p=2179059); [Mexico IFCs](https://asest.es/story/emprendimientos-maussan-y-gonzalez/); [Chile NCG 502 paper](https://www.e-publicacoes.uerj.br/publicum/article/download/95920/58512/389743); [Colombia, Portafolio](https://www.portafolio.co/economia/nueva-reglamentacion-para-el-crowdfunding-para-emprendimientos-519909). Mostly secondary; verify before use.

**Competitors:** linked in the section 4 table. Most 2026 figures (Securitize, Ondo, Maple, Huma) come from secondary aggregators or company-linked reports and are **not audited**. Figure's financials come from IPO-period reporting. RealT's 2026 liquidation and XAUt's redemption terms are **unverified**. Goldfinch's loss rate comes from a single source.

**Not verified / unavailable:** the authenticated app runtime (no sign-in); production database or migration state; CEPIRS supervision; the full text of the SMV 2025 amendment, including the current investor limits; current authorized FPF platforms (no consolidated SMV list found); a Credix 2025 status; Centrifuge loss history.
