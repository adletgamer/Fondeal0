# Fondealo — Product v2: Research, Refined Model, Flows & Build Prompts

> Purpose: mature the product — split the Business vs Investor experiences, define the
> full flow, and introduce **working capital as collateral**. Grounded in an
> exhaustive review of on-chain private-credit projects. Ends with **precise,
> copy-paste prompts for Claude Code**.

---

## 1. Competitor research — what worked, what died

| Project | Model | Outcome / lesson |
|---|---|---|
| **Goldfinch** | Uncollateralized, reputation/consensus underwriting, emerging markets | ~$18M defaults, **voted to wind down (2026)**. Pure trust-based lending across borders failed on legal enforceability. |
| **Credix** | LatAm trade-finance, asset-backed | **Effectively defunct.** |
| **Maple** | Was undercollateralized → **$54M defaults (2022)** → pivoted to **150%+ overcollateral** | Zero losses since the pivot. Design can contain risk. |
| **Huma Finance** | **Receivables / future income as collateral** ("PayFi"), short-duration, USDC | ~$216M TVL. Real cash-flow backing > pure reputation. |
| **Centrifuge** | Tokenized RWA with **senior/junior tranches**, SPVs | ~$1.6B TVL, institutional. Structured risk works. |
| **TrueFi / Clearpool** | Delegate-underwritten pools, **first-loss capital** | Low default rates (TrueFi ~0.2%, Maple ~2.3%). |
| **R2 (LatAm, Stellar-adjacent)** | **Embedded working-capital lending** for LatAm SMBs; Ant + FEMSA backed | Proves the *market*: LatAm SME working capital is a hot, fundable wedge. |
| On-chain scores: **Spectral, Cred, RociFi (NFCS), ARCx ("Credit Passport")** | Score anonymous **wallets** by generic DeFi borrow/repay | Prior art exists — but scores **wallets, not KYB'd businesses**, and isn't tied to real collateral or LatAm SMEs. |

### The three lessons that reshape Fondealo

1. **Reputation alone is a graveyard.** Every "trust us, they'll repay" protocol blew up. The
   winners are collateralized (Maple) or receivables-backed (Huma). *We must not sell
   uncollateralized lending.*
2. **The underwriter matters more than the contract.** Losses came from bad underwriting +
   unenforceable cross-border legal recourse, not Solidity bugs.
3. **First-loss + skin-in-the-game is the proven risk primitive.** Whoever underwrites/borrows
   posts capital that absorbs the first losses.

**Fondealo's edge, precisely stated:** we don't score anonymous wallets and we don't do naked
reputation lending. We score a **KYB-verified business** by its **Fondealo repayment history**, and
we use that reputation to **reduce how much of its own working capital it must post as first-loss
collateral**. Reputation becomes *capital efficiency you can bank*, not a badge.

---

## 2. Refined model — reputation-adjusted partial collateralization

### The core idea

A business posts a **fraction of the loan** as collateral, drawn from its **working capital (USDC)**.
That collateral is the **first-loss (junior)** tranche; investor capital is **senior**. The
**required collateral fraction shrinks as the credit score rises** — so good behavior directly
converts into needing less locked capital.

```
Loan 1 (score 500, band C): lock 50% collateral to borrow 100% → 2× leverage on working capital
Loan 4 (score 800, band A): lock 20% collateral to borrow 100% → 5× leverage
Default at any point: collateral is seized to repay investors first; score drops hard.
```

This is the flywheel: **repay → score up → collateral ratio down → cheaper, more capital-efficient
credit → stronger incentive to keep repaying.** It also makes the score *valuable and gameable-in-a-
good-way*: the only way to lower your collateral is real, externally-funded, on-time repayment.

### Parameters (v1 — transparent, fixed, tune later)

| Risk band | Score | Collateral ratio (of principal) | Suggested APR | Investor protection |
|---|---|---|---|---|
| A | 800–1000 | **20%** | ~12% | collateral covers first 20% of loss |
| B | 650–799 | **35%** | ~16% | first 35% |
| C | 500–649 | **50%** | ~20% | first 50% |
| D | 350–499 | **75%** | ~26% | first 75% |
| E | 0–349 | **100%** | ~32% | fully covered |

New KYB'd businesses start at **500 (band C, 50%)**. Ratios/APRs are illustrative and belong in a
governance-tunable config, not hard-coded magic numbers.

### How defaults resolve (MVP, honest)

1. Missed repayment past grace → opportunity marked **Defaulted**.
2. **Collateral is seized** and distributed pro-rata to investors (covers loss up to the collateral
   fraction).
3. **Residual loss** (loss beyond collateral) is borne by investors senior capital — disclosed
   up-front per opportunity ("max protected: X%").
4. `credit_score.on_default` applies the penalty; the business's next loan reprices to band D/E.
5. Off-chain legal recourse is **out of scope for Testnet MVP** and explicitly labeled as such.

### What we deliberately DON'T claim (credibility guardrails)

- Not "uncollateralized lending." It is **reputation-reduced partial collateral**.
- Not cross-border legal enforcement. Collateral is the on-chain enforcement.
- Not a yield product with guaranteed returns. Every opportunity shows max-protected % and residual
  risk.

### Optional v2 path (receivables, Huma-style)

Later, accept **tokenized receivables/invoices** as collateral in addition to USDC working capital,
verified by an off-chain adapter. Keep out of the MVP; note as the expansion that unlocks
non-cash-rich businesses.

---

## 3. Roles & flows

### Role split

After wallet connect (SEP-10), the user picks a role: **Business owner** or **Investor** (a wallet
can be both and switch). The choice routes to distinct dashboards, nav, and onboarding, and is
persisted (server-side by wallet address; localStorage only as a UX convenience).

### Business owner flow

```
Connect wallet
  → Choose "Business"
  → Register + KYB (SEP-12–shaped intake; MVP mock review)
  → Passport issued (score 500, band C)
  → Create financing request:
        amount, term, purpose
        → app computes required collateral (from band) + suggested APR + repayment schedule
  → Lock working-capital collateral (USDC) into escrow  →  opportunity goes "Open"
  → Investors fund; when target met → business receives principal (minus protocol fee)
  → Repay on schedule (principal + interest, USDC)
  → On completion: collateral released + score up + band improves (next loan needs less collateral)
  → On default: collateral seized for investors; score penalized
```

Business screens: Dashboard (Passport + active loans + collateral locked + next payment),
Create Request (with a live **collateral calculator**), Loan Detail (schedule, make payment,
payoff), Reputation (score history, what raises it).

### Investor flow

```
Connect wallet
  → Choose "Investor"
  → (optional) Deposit USDC into wallet-held balance
  → Browse Marketplace: filter by band, term, APR, collateral %, funding progress
  → Open an Opportunity: see the borrower's Passport/score, collateral coverage, risk/return,
    max-protected %, schedule
  → Fund (partial or full) in USDC  → position created
  → Track Portfolio: active positions, expected vs received, repayment status, collateral coverage
  → Receive repayments (principal + interest); on default, recover from seized collateral
```

Investor screens: Dashboard (portfolio KPIs: deployed, available, expected APR, at-risk),
Marketplace (filterable opportunity grid), Opportunity Detail (borrower passport + fund action),
Positions (track + history), Deposits/Withdraw.

### Shared

Account/wallet menu with role switch, transaction history, network/testnet badge, risk disclosures.

---

## 4. Information architecture (routes)

```
/                         landing (public)
/onboarding               connect + role select (guarded)
/onboarding/kyb           business KYB intake

/business                 business dashboard
/business/new             create financing request (collateral calculator)
/business/loans/[id]      loan detail + repay
/business/passport        reputation & score history

/invest                   investor dashboard (portfolio)
/invest/market            marketplace (opportunities + filters)
/invest/opportunity/[id]  opportunity detail + fund
/invest/positions         active positions & history

/account                  wallet, role switch, tx history
```

> Note: current app uses `/dashboard/business` and `/dashboard/investor`. v2 renames to
> `/business` and `/invest` as above; keep redirects.

---

## 5. Contract implications (for Phase 6 `loan_escrow`)

The escrow must encode collateral + tranche logic (specified for the build prompts):

- `create(opportunity_id, business, principal, term, collateral_amount, apr_bps)` — business-gated;
  pulls `collateral_amount` (USDC via SAC) from the business into escrow. `collateral_amount` must
  equal `principal * collateral_ratio(band)` checked against the Passport at creation.
- `fund(opportunity_id, investor, amount)` — pulls USDC from investor; tracks per-investor share;
  closes when funded == principal.
- `release(opportunity_id)` — on fully funded, transfers `principal` to the business; collateral
  stays locked.
- `repay(opportunity_id, amount)` — business pays; on final repayment, distributes principal+interest
  to investors pro-rata, **returns collateral to the business**, and calls
  `credit_score.on_repayment(business, on_time, external=true)`. Here **`external` is derived on-chain**
  = (there exists ≥1 funder address ≠ business), closing the anti-gaming gap from Phase 5.
- `default(opportunity_id)` — callable after `due + grace`; seizes collateral to investors pro-rata,
  marks Defaulted, calls `credit_score.on_default(business)`.
- Reporter wiring: escrow is the `credit_score` **reporter**; `credit_score` is the Passport
  `reputation_manager`. Set at deploy.

---

## 6. Precise prompts for Claude Code

Paste **Prompt 0 once** at the start of a Claude Code session in the repo, then run prompts 1→7 in
order. Each is self-contained and states acceptance criteria. Keep the existing design system,
extensionless imports, and Testnet-first posture.

---

### Prompt 0 — Context primer (paste first)

```
You are working in the Fondealo monorepo (pnpm + Turborepo). Stack: Next.js 15 (App Router,
Server Actions) + TypeScript + Tailwind + a local UI package (@fondealo/ui), @fondealo/sdk
(Stellar/Soroban via @stellar/stellar-sdk 16 + Stellar Wallets Kit v2), @fondealo/types (zod),
@fondealo/database (Prisma/Postgres), and packages/soroban (Rust contracts: business_passport,
credit_score; loan_escrow to be built). Design system: emerald+gold brand, Space Grotesk/Inter
fonts, components in packages/ui (Button/Card/Badge/Container), inline SVG icons in
apps/web/src/components/icons.tsx, ScoreGauge component. Conventions: extensionless relative
imports; Conventional Commits; everything Testnet-first; NO fictional data or fake contract
addresses; reuse existing components and tokens. Read docs/product-v2.md, docs/architecture.md,
docs/score-spec.md before coding. After each task: pnpm typecheck && pnpm lint must pass; for
contracts, cargo test && cargo clippy -D warnings. Work on a feature branch and commit in small,
reviewable steps.
```

### Prompt 1 — Role split + onboarding

```
Implement role-based onboarding and routing. After wallet connect (SEP-10 via @fondealo/sdk),
route the user to /onboarding to pick a role: "Business owner" or "Investor" (a wallet can be
both and switch later). Persist the role server-side keyed by wallet address (add a Prisma
`UserRole` relation on UserWallet: business/investor/both) via a Server Action; use localStorage
only as a UX cache. Add routes /business and /invest and redirect the legacy
/dashboard/business → /business and /dashboard/investor → /invest. Add an /account page with a
role switcher and a testnet badge. Guard /business/* and /invest/* so an unconnected wallet is
sent to /onboarding. Build a polished role-select screen using the existing design system (two
large branded cards, icons from icons.tsx). Acceptance: typecheck+lint pass; connecting a wallet
then picking a role lands on the right dashboard; refresh preserves the role.
```

### Prompt 2 — Collateral model in shared types + SDK helpers

```
In @fondealo/types add a transparent, governance-tunable collateral config: a `collateralRatioBps`
and `suggestedAprBps` per RiskBand exactly matching docs/product-v2.md §2 (A 20%/12%, B 35%/16%,
C 50%/20%, D 75%/26%, E 100%/32%), plus pure helpers: requiredCollateral(principal, band),
maxProtectedPct(band), and buildRepaymentSchedule(principal, aprBps, termDays, installments).
All money is USDC stroops as bigint-strings. Add zod schemas. In @fondealo/sdk add an EscrowClient
skeleton (read-only simulate methods: getOpportunity, listOpportunities, getPositions) mirroring
the loan_escrow interface in docs/product-v2.md §5; leave write methods as typed stubs that throw
"not deployed yet" until Prompt 6. Unit-test the pure helpers. Acceptance: typecheck+lint pass;
helpers covered by tests; no fictional contract addresses.
```

### Prompt 3 — loan_escrow Soroban contract (collateral + tranches)

```
Create packages/soroban/contracts/loan_escrow implementing docs/product-v2.md §5 with soroban-sdk
27: create/fund/release/repay/default, USDC via the Stellar Asset Contract (token client),
per-investor share tracking, collateral held in-contract, and cross-contract calls: on final
repayment call credit_score.on_repayment(business, on_time, external) where `external` is derived
on-chain as (a funder address != business exists); on default call credit_score.on_default. Enforce
collateral_amount == principal * collateralRatio(band) by reading the business_passport at create.
Gate roles (business, investors, a keeper for default). Write thorough unit tests INCLUDING: happy
path repay returns collateral + raises score, partial funding, default seizes collateral pro-rata,
and external=false path is impossible when a real investor funded. Update the deploy script to
deploy loan_escrow and wire it as credit_score's reporter. Acceptance: cargo test + cargo clippy
-D warnings clean; deploy script updated; do NOT deploy (no network here).
```

### Prompt 4 — Investor section (marketplace + opportunity + fund)

```
Build the mature investor experience under /invest using the design system and @fondealo/sdk
EscrowClient reads (fall back to clearly-labeled demo data ONLY where contracts aren't deployed):
- /invest dashboard: portfolio KPIs (deployed, available USDC, weighted APR, at-risk), positions
  summary.
- /invest/market: filterable opportunity grid (filters: risk band, term, min APR, collateral %,
  funding progress; sort by APR/risk/newest). Reusable OpportunityCard with a funding progress bar.
- /invest/opportunity/[id]: full detail — the borrower's Passport (reuse PassportCard/ScoreGauge),
  collateral coverage, max-protected %, risk/return, repayment schedule, and a Fund panel (amount
  input in USDC with validation, partial/full, projected return). Funding calls a Server Action that
  builds the escrow.fund tx for the connected wallet to sign (stub the signing until Prompt 6).
- /invest/positions: active positions with expected vs received, status, collateral coverage, history.
Include empty states, a plain-language risk disclosure, and mobile responsiveness. Acceptance:
typecheck+lint pass; screens look consistent with the landing; every risk/return figure derives from
the §2 config, not magic numbers.
```

### Prompt 5 — Business section (create request + collateral calculator + repay)

```
Build the business experience under /business using the design system:
- /business dashboard: Passport (reuse PassportCard), active loans, total collateral locked, next
  payment due, and a "capital efficiency" tile (current collateral ratio from band).
- /business/new: create a financing request. A live COLLATERAL CALCULATOR: as the business types
  amount/term, show required collateral (from band via @fondealo/types), suggested APR, repayment
  schedule, and "lock X USDC of working capital" summary. Submitting calls a Server Action that
  builds the escrow.create tx to sign (stub signing until Prompt 6) and locks collateral.
- /business/loans/[id]: schedule, make payment (USDC), payoff, and status.
- /business/passport: score history + a clear "what raises your score / lowers your collateral"
  explainer driven by docs/score-spec.md.
Acceptance: typecheck+lint pass; the calculator math equals @fondealo/types helpers; UX explains the
reputation→collateral flywheel explicitly.
```

### Prompt 6 — Wire to on-chain (replace stubs/demo with real reads/writes)

```
Once loan_escrow is deployed to Testnet and contract ids are in apps/web/.env.local, replace demo
data and stubbed signing with real flows: EscrowClient read methods via Soroban RPC simulate;
Server Actions that build create/fund/repay transactions, returned to the client for the Stellar
Wallets Kit to sign and submit; index contract events into Postgres (Opportunity, Funding,
Repayment, ScoreEvent projections) for fast dashboards. Add optimistic UI + tx status toasts and
robust error states. Keep on-chain authoritative; Postgres is only a projection. Acceptance:
typecheck+lint pass; a full loop (create → fund → repay → score up → collateral returned) works on
Testnet from the UI with a real wallet.
```

### Prompt 7 — Polish, trust & accessibility

```
Final pass: consistent empty/loading/error states across all screens; plain-language risk
disclosures and a "how Fondealo protects investors" explainer (collateral first-loss, max-protected
%); a "Deployments" page reading deployments/testnet.json with stellar.expert links to the live
contracts; WCAG AA color contrast and keyboard nav (audit the emerald/gold on dark); OpenGraph
images; and a short in-app "How it works" for each role. Acceptance: typecheck+lint pass; Lighthouse
a11y ≥ 95 on landing and both dashboards; all contract ids link to stellar.expert.
```

---

## 7. Suggested build order & branches

1. Prompt 1 (`feat/role-split`) → 2. Prompt 2 (`feat/collateral-config`) → 3. Prompt 3
(`feat/loan-escrow`) → deploy contracts to Testnet → 4. Prompts 4 & 5 (`feat/invest-ux`,
`feat/business-ux`) → 5. Prompt 6 (`feat/onchain-wiring`) → 6. Prompt 7 (`feat/polish`).

Each maps to a small PR. Prompts 4/5 can proceed with labeled demo data before Prompt 6 wires the
chain — so the UI matures in parallel with the escrow deploy.

---

## 8. Sources

- Tokenized private credit overview: https://www.spark.money/research/tokenized-private-credit-onchain
- On-chain private lending: https://chain.link/article/onchain-private-lending
- Huma Finance + USDC: https://www.circle.com/blog/how-huma-finance-uses-usdc-for-their-global-financing-platform
- Undercollateralized lending risk management: https://franklindao.substack.com/p/undercollateralized-lending-better
- DeFi credit score comparison (Spectral/Cred/RociFi/ARCx): https://chainaware.ai/blog/defi-credit-score-comparison/
- RociFi NFCS: https://roci.fi/nfcs · ARCx Credit Passport: https://wiki.arcx.money/
- Onchain factoring / tokenized invoices: https://chain.link/article/onchain-factoring · https://chain.link/article/tokenized-invoices
- R2 embedded lending LatAm: https://r2.co/blog/how-r2-embedded-finance-sets-a-new-standard-in-digital-lending · https://www.pymnts.com/news/international/latin-america/2025/ant-invests-in-r2-to-boost-latam-embedded-lending/
- Private credit 2026 comparison: https://eco.com/support/en/articles/15254025-tokenized-private-credit-2026-maple-centrifuge-goldfinch-compared
