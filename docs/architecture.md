# Fondealo — Proposed Architecture (Phase 2 draft)

**Status:** Proposed · pending approval to proceed to Phase 3 (Scaffolding)
**Baseline:** Protocol 27 · soroban-sdk 27.x · JS Stellar SDK 16.2.0 · Stellar CLI 27.1.0 · Stellar Testnet first.

This document translates `research.md` into a concrete system design. It is intentionally opinionated. Decisions with trade-offs are captured as ADRs under `docs/adr/`.

---

## 1. Design principles

1. **Own the credit-identity layer, compose everything else.** We build the Business Passport and Reputation Score. We integrate Blend (lending), Reflector (pricing), DeFindex (idle-liquidity yield), USDC-via-SAC (settlement). Composability is a product and a prize strategy.
2. **Hybrid on/off-chain by default.** On-chain: verifiable facts, hashes, score, counters. Off-chain (Postgres): PII, KYB documents, opportunity descriptions, UX metadata. Never put PII on-chain.
3. **Standards over bespoke.** SEP-10 for auth, SEP-12-shaped API for KYB, SAC for USDC. This buys interoperability and reviewer trust.
4. **Non-custodial where possible.** Value moves through contracts and user-signed transactions, not a Fondealo hot wallet, to shrink regulatory blast radius.
5. **Deterministic, transparent, open-source contracts.** Score logic must be auditable and reproducible; no hidden weights.
6. **TTL is a subsystem.** Persistent reputation entries are kept alive deliberately; archival is designed for, not discovered in production.

---

## 2. System context (C4 level 1)

```
                +-------------------+        +---------------------+
   Business --> |                   |        |   Stellar Testnet   |
                |   Fondealo Web    |  RPC   |  (Soroban / Horizon)|
  Investor  --> |  (Next.js 15)     +------->|                     |
                |                   |        |  business_passport  |
                |  Server Actions   |        |  credit_score       |
                |  + Postgres index |        |  loan_escrow (MVP)  |
                +----+----------+---+        |  USDC (SAC)         |
                     |          |            |  Blend / Reflector  |
             Wallets |          | KYB (mock->anchor, SEP-12 shape)
        (Wallets Kit,|          |
         Freighter,  v          v
         SEP-10)  Postgres   KYB/Compliance provider (later)
```

- **Frontend + Server Actions** orchestrate reads/writes, build & submit Soroban transactions, and index events into Postgres.
- **Wallets** hold keys; users sign SEP-10 login and every value transaction. Fondealo never holds business/investor private keys.
- **Soroban contracts** are the source of truth for Passport, score, and escrowed loan state.
- **Postgres** is a fast, queryable **projection/index** of on-chain state plus off-chain PII/metadata. On-chain remains authoritative for anything trust-bearing.

---

## 3. Monorepo layout (as requested)

```
fondealo/
  apps/
    web/                 # Next.js 15 (App Router, Server Actions), TS, Tailwind, shadcn/ui
  packages/
    ui/                  # shared shadcn/ui components, design system
    soroban/             # Rust workspace: business_passport, credit_score, loan_escrow
    sdk/                 # TS client: contract bindings, tx builders, SEP-10 helper, Wallets Kit wrapper
    database/            # Prisma/Drizzle schema + migrations (Postgres), repository layer
    types/               # shared TS types + zod schemas (cross-cutting contracts of the app)
  docs/                  # research, architecture, ADRs, roadmap, risks, backlog
  scripts/               # deploy/init contracts, seed testnet, fund USDC, TTL bumper
  .github/workflows/     # CI: lint, typecheck, test, cargo build+test, contract build
```

Tooling from day one (Phase 3): pnpm workspaces + Turborepo, ESLint, Prettier, Husky, Commitlint (Conventional Commits), GitHub Actions. Rust side: `cargo test`, `stellar contract build`, clippy/fmt.

---

## 4. Domain model

### 4.1 On-chain — `business_passport` (persistent storage)
Keyed by **business identity** (see ADR-0004 for identity key choice). Record:

| field | type | meaning |
|---|---|---|
| `kyb_status` | enum(None, Processing, Accepted, Rejected) | mirrors SEP-12 lifecycle |
| `score` | u32 (0–1000) | current credit reputation score |
| `risk_band` | enum(A..E) | derived risk tier used for pricing |
| `loans_total` | u32 | lifetime loans taken |
| `loans_repaid` | u32 | lifetime loans fully repaid |
| `on_time_streak` | u32 | consecutive on-time repayments |
| `issued_at` | u64 (ledger/time) | Passport issuance |
| `updated_at` | u64 | last mutation |
| `data_hash` | BytesN<32> | hash/commitment of off-chain KYB bundle |

Read-only accessors are public so **any Stellar contract can consume the trust primitive**. Writes are gated to authorized Fondealo contracts/roles.

### 4.2 On-chain — `credit_score` (reputation engine)
Pure, deterministic transition functions invoked on loan lifecycle events. v1 sketch (to be finalized in a dedicated score spec + ADR):
- `on_repayment(on_time: bool, principal, external_funded: bool)` → adjust `score`, `on_time_streak`, `risk_band`.
- Rewards **net external repayment**, applies **diminishing returns** and **decay**, penalizes default/late. Anti-gaming rules keep round-trip self-funding score-neutral (see Risks R-01).

### 4.3 On-chain — `loan_escrow` (MVP) → Blend (later)
- MVP: investor funds an opportunity → USDC escrowed in contract → released to business → business repays → on final repayment, `credit_score.on_repayment` fires and Passport updates.
- Later: replace escrow money-movement with a **Fondealo-curated Blend pool**; Passport/score stay constant. Idle investor USDC can earn via **DeFindex** while awaiting deployment.

### 4.4 Off-chain — Postgres (index + PII)
Tables (indicative): `businesses` (PII, KYB docs refs), `kyb_submissions`, `opportunities`, `fundings`, `repayments`, `passport_projection`, `score_events`, `users_wallets`. On-chain events are indexed here for fast dashboards; Postgres is never authoritative for score/passport.

---

## 5. Core user flows

### 5.1 Auth (SEP-10)
1. User connects wallet via **Stellar Wallets Kit** (Freighter default).
2. App requests a SEP-10 challenge (Fondealo web-auth endpoint), user signs, server verifies, issues **JWT session**.
3. JWT authorizes Server Actions; the wallet public key is the account identity.

### 5.2 Business onboarding → Passport
Register → submit KYB (SEP-12-shaped form; MVP mock/manual review) → on `ACCEPTED`, Fondealo authorizes minting/initialization of the on-chain Passport (`kyb_status=Accepted`, initial `score`, `risk_band`, `data_hash`).

### 5.3 Opportunity → funding (USDC)
Business creates an opportunity (amount, term, rate suggested by risk_band). Investor deposits USDC (SAC) into escrow for that opportunity. When target met, funds release to the business.

### 5.4 Repayment → score update
Business repays USDC per schedule. Each repayment is recorded; the **final** repayment (or each on-time installment, TBD in score spec) triggers `credit_score.on_repayment`, which **increments score, extends streak, and may improve risk_band** — persisted in the Passport so it **survives into the next loan**.

---

## 6. Contract interfaces (sketch, subject to Phase 4/5 refinement)

```rust
// business_passport
fn init(admin: Address, authorized_writer: Address);
fn issue(business: Address, kyb_status: KybStatus, data_hash: BytesN<32>);
fn get(business: Address) -> Option<Passport>;          // public read
fn set_kyb(business: Address, status: KybStatus);       // gated
fn bump_ttl(business: Address);                          // TTL subsystem

// credit_score
fn on_repayment(business: Address, on_time: bool, principal: i128, external: bool);
fn on_default(business: Address, principal: i128);
fn preview(business: Address) -> (u32 /*score*/, RiskBand);

// loan_escrow (MVP)
fn create(opportunity_id: u64, business: Address, amount: i128, term: u32);
fn fund(opportunity_id: u64, investor: Address, amount: i128);   // pulls USDC via SAC
fn release(opportunity_id: u64);                                 // to business when funded
fn repay(opportunity_id: u64, amount: i128);                     // updates score on completion
```

All USDC movement uses the **USDC Stellar Asset Contract** address (testnet) via `token` client; no custom asset.

---

## 7. Security & trust model (Build-Award tranche-2 requirement)

- **Authorization:** `require_auth` on every state-mutating entrypoint; writer roles for score/passport restricted to Fondealo contracts. Admin keys documented and rotated.
- **Threat model (to expand):** Sybil businesses, wash/self-repayment score farming, oracle manipulation (Reflector), reentrancy on escrow release, TTL-archival griefing, admin key compromise.
- **Monitoring plan:** index all contract events, alert on anomalous score deltas, large fundings, repeated self-referential funder↔business pairs.
- **Open-source:** contracts open-sourced with reproducible build (`stellar contract build`) and published Wasm hashes.

---

## 8. Environments

- **Testnet-first** for all of Phase 1–7; Circle USDC testnet faucet for funding demos.
- Deterministic deploy scripts in `scripts/` (deploy contracts, wire USDC SAC address, seed businesses, TTL bumper cron for demo longevity).
- Mainnet only as the final Build-Award tranche, with audit + threat model complete.

---

## 9. Explicit non-goals for MVP (Phase 1 scope guard)

No secondary market, no AI scoring, no mobile app, no multi-asset/FX, no custodial fund pooling. Validate the core loop first: **register → KYB → Passport → opportunity → fund (USDC) → repay → score up.**

See ADRs for the reasoning behind each contested choice.
