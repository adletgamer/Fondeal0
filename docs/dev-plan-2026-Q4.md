# Fondealo — Development Plan Update (Q4 2026)

> Architect-level review: where the repo actually is today, what changed in the
> Stellar ecosystem, and a revised, trend-aligned development plan. Written as the
> single source of truth to supersede the roadmap items in `docs/roadmap.md` and
> `docs/product-v2.md` where they conflict.

**Date:** 2026-10-08 · **Author:** CTO/architect review · **Repo:** main @ `c1ccfb9`

---

## 1. Current state of the repo (honest assessment)

The build has moved far beyond the original phase plan. On `main` today:

**Smart contracts (`packages/soroban`) — built & tested, NOT deployed**
- `business_passport`, `credit_score`, **`loan_escrow`** (523 LoC + 429 test LoC) all present.
- Still **no Testnet deployment**: no `C…` contract ids in the repo/env, README Deployments table shows all three `⏳ pending`. This is the single biggest blocker.

**Frontend (`apps/web`) — v2 flows implemented, on demo data**
- Role split is live: `/business/*` (dashboard, `new`, `loans/[id]`, `passport`, `verify`) and `/invest/*` (dashboard, `market`, `opportunity/[id]`, positions), plus `/onboarding` and a `/design-system` page.
- Rich components already exist: `collateral-calculator-form`, `kyb-wizard`, `fund-panel`, `repay-form`, `reputation-simulator`, `score-breakdown`, `risk-disclosure`, `passport-v2`, dark-mode `theme-toggle`, `data-source-badge` (tells us the app is still labeling demo vs live data).
- **Auth switched to Privy** (`@privy-io/react-auth` 3.x + `server-auth`) with a session architecture (cookies, `session-sync`, `auth-gate`). This is new since the SEP-10/Wallets-Kit design and needs a deliberate custody decision (see §3).

**Design system (`packages/ui`)** matured: `address-chip`, `risk-badge`, `field`, `tx-status`, tokenized `button/card/badge`.

**Docs** now include `product-v2.md`, `passport-v2.md`, `strategy/` (differentiation-moat, verifier-network), `rfc/0001-stellar-mcp-integration`, `audits/` (login/session/stellar-dep, 2026-08-31), `deployment-and-database.md`.

**Verdict:** the *product surface* is ~80% of the MVP vision; the *on-chain reality* is 0% deployed. The gap between a polished demo and a credible on-chain product is now the whole game — and it's exactly what SCF judges probe.

---

## 2. What changed in the Stellar ecosystem (Q1–Q4 2026)

Fresh, sourced, and directly relevant:

- **Payments are the proven wedge.** Stablecoin payment volume hit an all-time high **$5.5B in a quarter, +72% YoY**; velocity +75%. Network: 22.5B operations, 99.99% uptime, ~$0.0001 fees. Repeat usage (not raw volume) is SDF's stated adoption signal. [Q1'26]
- **RWA on Stellar is exploding: ~$785M (EOY 2025) → $2B+ (Q2'26), ~2.5× in a quarter.** Issuers: Franklin Templeton (BENJI), Spiko (EU T-bills ~$970M), Kenanga (Malaysia MMF), AllUnity (EURAU/EURC). Institutions circling: U.S. Bank, Amundi, Société Générale.
- **SDF put $1M into Ascend** (PSG Digital) for **regulated RWA credit infrastructure** — ERC-3643 permissioned assets as collateral in credit vaults, institutional focus. *Not SME.* Signal: on-chain credit infra is an SDF priority; the SME/working-capital layer is open.
- **LatAm is the hottest region**: **$730B crypto moved in 2025, +60% YoY** — Fondealo's exact market.
- **Protocol moved P26 → P27 → P29** (mainnet Oct 1, 2026). Current toolchain: **Core/RPC/Horizon 29.0.0, soroban-sdk 28.0.0, stellar-cli 28.1.0, JS SDK 17.2.1.** The repo pins soroban-sdk 27 / JS 16.2 — **behind by a major protocol.**
- **Three new protocol capabilities worth designing around:**
  - **Privacy — X-Ray ZK layer is live**, plus an ERC-7984 confidential-token standard (with OpenZeppelin). Enables *proving KYB passed without exposing documents*.
  - **Agentic payments — x402 spec + MPP SDK shipped.** Programmatic, agent-initiated payments (auto-repay, auto-disburse).
  - **Security — Protocol 26 "Yardstick" CAP-77 Quorum Freeze.**
- **Meridian 2026: Oct 28–29, Lisbon** — a concrete demo/launch deadline to aim at.

---

## 3. Strategic recommendations (what a web3 architect would change)

### R1 — Deploy to Testnet now; it is the credibility unlock
Nothing else moves the needle with SCF/judges like going from "live web demo" to **"live contracts with on-chain metrics."** Upgrade the toolchain (R2) and run `scripts/deploy_testnet.sh`, paste `C…` ids into README + env, flip the `data-source-badge` to live. This alone takes the application's "Estado actual" from *Prototipo* to *Desplegado en testnet*.

### R2 — Upgrade to Protocol 29 toolchain
Bump `soroban-sdk` 27→**28**, `stellar-cli`→**28.1**, JS SDK 16.2→**17.2**, target Testnet P29. Do this before deploy so the contracts are built against current host. Re-run `cargo test` + `clippy`; fix any 28.x API deltas (events/auth macros move fastest).

### R3 — Resolve the custody story (Privy × SEP-10)
Privy gives frictionless onboarding (email/social + embedded wallet) — great for LatAm SME owners who don't hold XLM. But the pitch's "non-custodial · SEP-10" line now needs nuance. Recommended model, documented in an ADR:
- **Privy embedded wallet = self-custodial key** the user controls; Fondealo never holds keys.
- Use Privy for onboarding + signing; keep **SEP-10** as the on-chain auth assertion where an anchor/contract needs it.
- State plainly for judges: "self-custodial by default; Privy abstracts key management, Fondealo custodies nothing." Don't let the UX win become a custody liability in the write-up.

### R4 — Make the collateral + reputation real on-chain (the moat)
The `loan_escrow` already encodes working-capital collateral + the reputation→collateral flywheel from `product-v2`. Prove it end-to-end on Testnet: create → fund → repay → score up → collateral returned, with `external` derived on-chain (funder ≠ business). This is the defensible, anti-gaming story that separates Fondealo from the protocols that died on naked reputation lending.

### R5 — Position against Ascend, don't collide
Ascend = institutional, regulated, ERC-3643 permissioned vaults. Fondealo = **SME working-capital + portable reputation + LatAm**. Frame Fondealo as the *origination & reputation layer for small borrowers* that could one day feed institutional capital (Ascend-style vaults) as senior tranches. Complement, not competitor — and a partnership narrative for SCF.

---

## 4. Trend-aligned features to add to the roadmap (the "super plan" upside)

Each maps a 2026 Stellar trend to a concrete, scoped Fondealo feature. Prioritized by signal-per-effort.

| # | Feature | Trend it rides | Why it wins | Effort |
|---|---|---|---|---|
| F1 | **On-chain testnet deploy + live dashboards** | Repeat-usage adoption metric | Turns demo into product; produces the NAV/volume/repayment metrics SCF wants | M |
| F2 | **Local-currency opportunities, USDC settlement, Reflector FX** | EURC + local-stablecoin growth; LatAm | SME thinks in soles/pesos; price in local, settle USDC — removes FX friction | M |
| F3 | **ZK proof-of-KYB (X-Ray / confidential)** | Privacy primitives live | "Prove verified without exposing documents" — strong PII + compliance narrative | L (spike first) |
| F4 | **Agent auto-repay / scheduled disbursement (x402 / MPP)** | Agentic payments shipped | A business treasury agent repays on schedule; judges love a live agentic demo | M |
| F5 | **Receivables/invoice as collateral (ERC-3643-style)** | RWA 2.5×/quarter; Ascend | Expands beyond cash-rich SMEs; bridges to institutional capital | L |
| F6 | **Verifier/underwriter network** (per `docs/strategy/verifier-network.md`) | "Underwriter > contract" lesson | Decentralizes KYB/underwriting with staked verifiers — progressive decentralization story | L |
| F7 | **Investor pool mode (diversified, auto-allocated)** | Private-credit tranching norms | Lets passive investors deposit once and spread across vetted deals | M |

Do **F1 + F2** for the next milestone; treat **F3/F4** as the "wow" demo features for Meridian; keep **F5/F6/F7** as the post-MVP expansion.

---

## 5. Revised roadmap

| Phase | Goal | Deliverable | Status |
|---|---|---|---|
| 0 | **Toolchain upgrade** | P29 / soroban-sdk 28 / JS 17; green CI | ⬜ next |
| 1 | **Testnet go-live** | 3 contracts deployed + wired; ids in README/env; dashboards read live chain; data-source-badge → "live" | ⬜ |
| 2 | **End-to-end loop proof** | create→fund→repay→score↑→collateral returned on Testnet from the UI with a real (Privy) wallet; recorded demo | ⬜ |
| 3 | **Custody ADR + SEP-10 clarity** | ADR-0009 documenting Privy self-custody model; pitch copy updated | ⬜ |
| 4 | **LatAm FX (F2)** | local-currency denomination + Reflector pricing, USDC settlement | ⬜ |
| 5 | **Meridian demo polish (F3/F4 spike)** | ZK-KYB and/or agentic auto-repay as a headline demo | ⬜ (target Oct 28–29) |
| 6 | **Metrics + SCF submission** | on-chain metrics dashboard (NAV, volume, repayment rate, avg collateral ratio), threat model, open-source build; SCF Build track | ⬜ |

Immediate critical path: **Phase 0 → 1 → 2** is the whole credibility jump and is mostly wiring + deploy, not new product.

---

## 6. Risks / watch-items (new or changed)

- **R-12 Custody ambiguity (Privy).** Mitigate with R3/ADR-0009 before the SCF write-up.
- **R-13 Protocol drift.** Being a major protocol behind (27 vs 29) risks build breakage and "stale" perception. Fix in Phase 0.
- **R-14 Demo-vs-real gap.** A beautiful app on mock data reads as vaporware to technical judges; Phase 1/2 closes it.
- **R-15 RWA competition heat.** Ascend + institutional issuers crowd "credit on Stellar"; defend the SME/LatAm/reputation niche explicitly (R5).
- Carry-over: R-01 reputation gaming (mitigated on-chain via `external`), R-02 TTL archival, R-03 custody/regulatory, R-04 KYB vendor.

---

## 7. Precise next-step prompts for Claude Code

Paste in order after the Prompt 0 context primer in `product-v2.md`.

```
PROMPT A — Toolchain to Protocol 29
Upgrade the Soroban workspace to soroban-sdk 28 and target Testnet Protocol 29; bump stellar-cli
to 28.1 in CI and scripts, and @stellar/stellar-sdk to ^17.2 in packages/sdk + apps/web. Fix any
28.x API changes (events, auth, storage). Run cargo test + cargo clippy -D warnings and pnpm
typecheck/lint until green. Update README tech baseline and docs/architecture.md version pins.
Acceptance: all tests/lints green; no references to soroban-sdk 27 or JS SDK 16 remain.
```

```
PROMPT B — Deploy to Testnet + wire live reads
Run scripts/deploy_testnet.sh against Protocol 29 Testnet (fund via Friendbot), deploy
business_passport, credit_score, loan_escrow, wire roles (escrow = credit_score reporter;
credit_score = passport reputation_manager), and write C… ids to apps/web/.env.local +
deployments/testnet.json + the README Deployments table. Then replace demo data: make the
EscrowClient/PassportClient read via Soroban RPC simulate, and flip data-source-badge to "live"
when ids are present. Acceptance: dashboards show real on-chain state for a seeded business; all
three ids link to stellar.expert.
```

```
PROMPT C — Prove the end-to-end loop from the UI
Wire create/fund/repay Server Actions to build Soroban txs the Privy embedded wallet signs and
submits; index contract events into Postgres projections. Seed one business through
register→KYB→passport→create opportunity (lock working-capital collateral)→investor funds→repay→
score up→collateral returned, with external derived on-chain. Add tx-status toasts and error
states. Acceptance: a full loop completes on Testnet from the browser; a ScoreEvent is recorded
and the collateral returns to the business.
```

```
PROMPT D — Custody ADR + SEP-10 clarity (ADR-0009)
Write docs/adr/0009-custody-model.md documenting the Privy embedded-wallet self-custody model and
where SEP-10 is used; update landing/pitch copy so "non-custodial" is precise. No key custody by
Fondealo. Acceptance: ADR merged; copy no longer overclaims.
```

```
PROMPT E — LatAm FX (local-currency opportunities)
Add local-currency denomination to opportunities (display in PEN/COP/MXN, settle in USDC) with
Reflector oracle pricing and clear FX disclosure. Keep all value flows in USDC on-chain.
Acceptance: an opportunity can be created in a local currency and funded/repaid in USDC with a
shown FX rate and timestamp.
```

> Treat ZK-KYB (X-Ray) and agentic auto-repay (x402/MPP) as research spikes before full prompts —
> each deserves its own RFC in `docs/rfc/` first.

---

## 8. Sources

- Stellar Q1 2026 execution: https://stellar.org/blog/foundation-news/q1-2026-execution-at-network-scale
- Software versions (Protocol 29): https://developers.stellar.org/docs/networks/software-versions
- Protocol 28 upgrade guide: https://stellar.org/blog/developers/adapter-protocol-28-upgrade-guide
- SDF invests $1M in Ascend (RWA credit): https://stellar.org/press/stellar-development-foundation-makes-strategic-investment-in-ascend-to-accelerate-compliant-rwa-infrastructure-development
- State of Stellar Q4 2025 (Messari): https://messari.io/report/state-of-stellar-q4-2025
- SCF 2025 impact report: https://medium.com/stellar-community/stellar-community-fund-2025-impact-report-6f6c6361aaca
- SCF Build track 2026: https://grantedai.com/grants/stellar-community-fund-scf-build-track-stellar-development-foundation-50b61d52
