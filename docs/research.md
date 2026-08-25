# Fondealo — Research (Phase 1)

> Credit infrastructure for Latin American SMEs, built natively on Stellar (Soroban, USDC, on-chain reputation).
> This document is the evidence base for every architectural decision that follows. It is written for a Stellar Community Fund (SCF) reviewer as much as for the engineering team.

**Status:** Living document · **Owner:** CTO/Founder · **Last updated:** 2026-08-25
**Network baseline:** Protocol 27 (mainnet, July 2026) · Rust SDK `27.x` · JS Stellar SDK `16.2.0` · Stellar CLI `27.1.0`.

---

## 0. TL;DR for a busy reviewer

Fondealo is **not** a lending protocol. It is a **reusable business-credit identity layer** — the *Business Passport* — plus a **portable on-chain reputation score** that makes SME lending on Stellar underwriteable and repeatable. We deliberately **do not rebuild lending**: we compose on **Blend** (audited lending primitive, +284% TVL in 2025), price with **Reflector**, and can route idle investor liquidity through **DeFindex**. Our defensible surface is the data and identity layer that these DeFi primitives lack: *who is this business, can they repay, and does good behavior compound across loans?*

This maps cleanly onto what SCF rewarded in 2025–2026: financial inclusion in underserved markets (33% of funded companies), composability with existing ecosystem primitives (an explicit Build Award preference), and infrastructure that "meaningfully improves core features, not a superficial integration."

---

## 1. Problem & thesis

Latin American SMEs are chronically underbanked: thin credit files, collateral-heavy underwriting, 30–60 day payment cycles, and fragmented KYC/KYB that must be redone at every institution. Capital exists (regional and diaspora investors want USDC yield) but there is no cheap, portable, verifiable way to answer three questions at underwriting time:

1. **Identity/eligibility** — is this a real, KYB-verified business?
2. **Creditworthiness** — what is their repayment history and risk?
3. **Portability** — does a clean repayment record on loan #1 lower the cost of loan #4, anywhere in the network?

**Thesis:** If business identity and repayment reputation live on-chain in a reusable, verifiable object, then (a) underwriting cost collapses, (b) good borrowers are rewarded with cheaper capital over time, and (c) any lender/pool on Stellar can consume the same trust primitive. Stellar is the right chain because USDC settlement, sub-cent fees, SEP standards for KYC/auth, and a live DeFi stack (Blend/Reflector/DeFindex) already exist — we add the missing credit-identity layer on top.

---

## 2. Ecosystem findings (official sources)

### 2.1 Soroban smart contracts
- Rust → Wasm; only a **narrow subset of Rust**, no std, third-party crates must be Soroban-compatible. Contracts **cannot** touch SDEX, claimable balances, or sponsorships.
- **Three storage tiers** with very different economics and lifetimes:
  - **Persistent** — default for durable data (user balances, credit history). On TTL expiry it is **archived, not deleted**, and can be restored. Most expensive, unlimited keys.
  - **Instance** — small config bound to the contract instance, loads with the contract, shares its TTL; limited to ~tens–hundreds of keys (ledger entry size limit). Good for admin address, asset addresses, parameters.
  - **Temporary** — cheapest, low TTL, **gone forever on expiry**. Good for oracle reads, sessions, nonces. **Never** store reputation here.
- **State archival / TTL** is a first-class design concern: any per-business record must be persistent and must be kept alive via TTL bumps (or restored), or it silently archives. This is a real correctness risk for a "reputation that must survive between loans" product (see Risks).

**Implication for Fondealo:** the Business Passport and reputation records are **persistent** storage keyed by business identity; contract parameters/admin are **instance**; oracle snapshots are **temporary**. TTL management is a designed subsystem, not an afterthought.

### 2.2 Assets & USDC
- **USDC** is native on Stellar (Circle issuer) and exposed to Soroban via the **Stellar Asset Contract (SAC)** — a contract address that lets smart contracts hold/move USDC like any token. Circle provides a **testnet faucet** and CCTP support for Stellar. Fondealo uses USDC-via-SAC for all value flows; no custom token.

### 2.3 Authentication & KYC standards
- **SEP-10 (Web Auth):** wallet proves control of a Stellar account by signing a server-issued challenge transaction; server returns a JWT. This is our **wallet-based login** — no passwords, cryptographic proof of account ownership. Works with custodial and non-custodial keys.
- **SEP-12 (KYC/KYB API):** standard PUT/GET customer endpoints (fields, statuses: `NEEDS_INFO`, `PROCESSING`, `ACCEPTED`, `REJECTED`). This is the **interface shape** for our KYB intake, whether we self-KYB or delegate to an anchor/provider.
- **Anchors / SDP:** the **Stellar Disbursement Platform** is a production, open-source backend for bulk USDC payouts with built-in SEP-10/-24/-31 rails (used by UNHCR for cash assistance). Relevant later for **investor→business disbursement at scale** and business→worker payouts, though MVP can settle directly contract-side.

### 2.4 DeFi primitives (build-vs-integrate is decided here)
- **Blend** (live on mainnet): permissionless, **isolated lending pools**, mandatory **backstop** insurance module, reactive interest-rate model, audited. Anyone can deploy a pool. **Decision driver:** we integrate Blend as the lending engine instead of writing our own money market. Fondealo becomes the *underwriting + identity* layer that decides who gets into a Fondealo-curated pool and on what terms.
- **Reflector** (SCF-recognized oracle): on-chain price feeds (CEX/DEX aggregated), designed for low fees / efficient ledger usage. Used for USDC/collateral valuation and any FX (local-currency invoice → USDC).
- **DeFindex** (yield abstraction): tokenized vaults + prebuilt strategies via a simple API; routes deposits into Blend without taking custody. Real proof point: **Beans wallet** tripled average deposits with 70% retention using DeFindex→Blend. **Use:** park idle investor USDC in yield while it waits to be deployed to a loan.
- **Composability is the intended design pattern** on Stellar and an explicit SCF value. Fondealo's whole architecture is "compose the money-legos, own the credit-identity layer."

### 2.5 Wallets & tooling
- **Stellar Wallets Kit** (`@creit.tech/stellar-wallets-kit`, maintained by Creit Tech) — one API over Freighter, xBull, Albedo, Lobstr, Hana, and **passkey/smart-wallet** flows. This is our wallet abstraction; **Freighter** is the primary reference wallet for the demo.
- **Stellar CLI 27.1.0**, **soroban-sdk 27.x**, **JS SDK 16.2.0** are the pinned toolchain.

---

## 3. Market / prize findings (SCF 2025 Impact Report & Build Award)

- **Scale:** $14.4M in XLM to **154 projects** in 2025 (~25% acceptance of 1,163 submissions); $16.8M+ including Audit Bank, Public Goods, Growth Hack, Liquidity awards.
- **Where money went:** Applications (largest), Financial Protocols (54), Infrastructure & Services (54), Developer Tooling (61).
- **Verticals that won:** DeFi/RWA (Blend, Aquarius TVL +~284%; PYUSD/USDY RWAs launched), cross-border payments (AlfredPay $15M Series A, Honeycoin $5M seed, ScopeX €100M volume, Peer 160K MAU), and **financial inclusion — 33% of funded companies deliberately targeted underserved markets.**
- **Build Award criteria that shape us directly:**
  1. **Traction / validated need** (verifiable, can be off-chain) — we must show real SME demand and design signal.
  2. **Stellar relevance is substantive**, not superficial or "just data storage."
  3. **Prefer leveraging existing ecosystem solutions** — *composability is rewarded* (this validates Blend/Reflector/DeFindex integration over rebuilding).
  4. **Open-source plan for smart contracts** is required.
  5. **Three tranches, final = mainnet launch**, with credible **on-chain metric commitments** (NAV, tx volume) at the end.
  6. **Tranche #2 needs a threat model + monitoring plan** (security is continuous, not a one-time audit).
- **2026 signals:** referral-based intake for signal quality, post-mainnet growth support, continuous security, adapting to AI-assisted development.

**Positioning conclusion:** Fondealo sits at the intersection of the three best-funded themes (DeFi + inclusion + LatAm payments) and satisfies the composability + open-source + mainnet-metrics rubric if we execute the tranche plan.

---

## 4. Opportunities (why we can win)

1. **Unowned layer.** Blend/DeFindex are capital rails with *no* borrower-identity or credit-history primitive. The Business Passport + portable score is a genuinely missing money-lego, not a reskin.
2. **Composability multiplier.** Every other Stellar lender could eventually *consume* Fondealo reputation — a B2B/protocol distribution path, not just a single app.
3. **Inclusion narrative with hard on-chain metrics.** "Cheaper capital for LatAm SMEs as they build reputation" is exactly the SCF thesis and produces the NAV/volume/repayment metrics the Build Award wants at mainnet.
4. **Standards-native.** SEP-10 login and SEP-12-shaped KYB make us interoperable with anchors and legible to reviewers, versus a bespoke auth stack.
5. **Demo-ability.** The core loop (register → KYB → Passport → opportunity → fund in USDC → repay → score up) is a tight, visual, judge-friendly narrative for InstaAwards.

---

## 5. Risks (summarized; full register in `risks.md`)

- **Reputation as attack surface.** On-chain score that lowers borrowing cost creates a direct incentive to game it (Sybil businesses, wash-repayments, self-funding to farm score). Requires KYB-gated identity, cost-of-attack > reward, and score logic that rewards *net external* repayment, not round-trips.
- **State archival.** Persistent reputation entries can be archived on TTL expiry; a business returning after 18 months could hit an archived Passport. Need TTL-bump strategy and restore path.
- **Custody & regulation.** Holding/moving investor USDC is a money-transmission/securities question per jurisdiction (Peru/LatAm). MVP must stay **non-custodial** where possible (contract escrow, investor-signed flows) and be explicit about what is testnet-only.
- **KYB reality.** Real KYB is a vendor/anchor problem, not a weekend build. MVP uses a mock/manual KYB with a SEP-12-shaped interface so the real provider is a drop-in later.
- **Oracle / FX dependency.** Local-currency invoices → USDC introduces FX and oracle-freshness risk (Reflector staleness, manipulation). Keep MVP in USDC-denominated terms; treat FX as Phase 6+.
- **Over-scoping.** The temptation to build the money market. We explicitly integrate Blend and keep Fondealo to identity + underwriting + reputation.

---

## 6. Recommended architecture (detail in `architecture.md` + ADRs)

**Shape:** Next.js 15 app (App Router, Server Actions) + PostgreSQL (off-chain index, KYB PII, opportunity metadata) + Soroban contracts (Business Passport registry, Reputation/Score, Loan escrow) + USDC-via-SAC + Blend for the lending engine + Reflector for pricing + Stellar Wallets Kit/SEP-10 for auth.

**Golden rule (hybrid on/off-chain):** PII and heavy metadata **off-chain** (Postgres) with only **hashes/commitments and score-relevant facts on-chain**. The Passport is an on-chain **verifiable record** (KYB status flag, score, risk band, payment counters, issued-at) whose sensitive backing data lives off-chain and is provable by hash. This keeps us GDPR/data-law-sane and cheap, while remaining "verifiable from Soroban" as required.

**Two contracts do the differentiated work:**
- **`business_passport`** — persistent per-business record: `{ kyb_status, score, risk_band, loans_total, loans_repaid, on_time_streak, issued_at, updated_at, data_hash }`, readable by any contract → this is the composable trust primitive.
- **`credit_score` / reputation** — deterministic score transitions on repayment events: each successful, on-time, externally-funded repayment increases score and lowers risk band; the record persists across loans. Score logic is transparent and open-source.
- **`loan_escrow`** (thin) for MVP funding/repayment, or a **Fondealo-curated Blend pool** as we mature. Escrow lets us fully control the demo loop before delegating to Blend.

**Recommended integration posture:** MVP = own thin escrow to nail the loop and the metrics; Phase 6+ = migrate the money movement to Blend pools and idle-liquidity yield to DeFindex, keeping the Passport/score as the constant.

---

## 7. Open questions to resolve before/within Phase 2

1. **Custody model** for investor USDC in MVP: contract escrow vs. investor-signed per-fund transfers (regulatory blast radius).
2. **Score function v1**: exact inputs, weights, decay, and anti-gaming rules (needs its own spec + ADR).
3. **Passport identity key**: Stellar account of the business vs. a Fondealo-issued business ID (affects Sybil resistance and portability).
4. **Blend now vs later**: curate a Fondealo Blend pool in MVP, or escrow-first then migrate (leaning escrow-first for demo control).
5. **KYB provider path**: which anchor/vendor becomes the real SEP-12 backend post-MVP.

---

## 8. Sources

- Stellar software versions (Protocol 27): https://developers.stellar.org/docs/networks/software-versions
- Soroban smart contracts overview: https://developers.stellar.org/docs/build/smart-contracts/overview
- Choosing the right storage / state archival: https://developers.stellar.org/docs/build/guides/storage/choosing-the-right-storage · https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/state-archival
- Stellar Asset Contract (USDC in Soroban): https://developers.stellar.org/docs/build/guides/tokens/stellar-asset-contract
- SEP-10 Web Auth: https://developers.stellar.org/docs/build/apps/wallet/sep10
- SEP-12 KYC: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md
- Stellar Disbursement Platform: https://developers.stellar.org/docs/platforms/stellar-disbursement-platform · UNHCR case study: https://stellar.org/case-studies/unhcr
- Blend Protocol (docs + FAQ): https://docs.blend.capital/users/general-faq · contracts: https://github.com/blend-capital/blend-contracts
- Reflector oracle: https://developers.stellar.org/docs/data/oracles/oracle-providers · SCF profile: https://communityfund.stellar.org/project/reflector-5w2
- DeFindex: https://docs.defindex.io/whitepaper/10-whitepaper · Beans/DeFindex composability: https://stellar.org/blog/developers/composability-on-stellar-from-concept-to-reality
- Stellar Wallets Kit: https://github.com/Creit-Tech/Stellar-Wallets-Kit · https://www.npmjs.com/package/@creit.tech/stellar-wallets-kit
- SCF 2025 Impact Report: https://medium.com/stellar-community/stellar-community-fund-2025-impact-report-6f6c6361aaca
- SCF Build Award submission criteria: https://stellar.gitbook.io/scf-handbook/scf-awards/build-award/submission-criteria
- SCF Soroban infrastructure recap: https://stellar.org/blog/ecosystem/stellar-community-fund-recap-soroban-infrastructure
