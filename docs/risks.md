# Fondealo — Risk Register

> Updated 2026-10-11. This is a qualitative engineering register, not a scored regulatory assessment. See [operating model](operating-model.md) for release gates.

Severity is a qualitative priority estimate. Assign a named owner and review date before each release; neither is assigned by this document.

| ID | Risk | Likelihood | Impact | Severity | Mitigation | Status |
|---|---|---|---|---|---|---|
| R-01 | **Reputation gaming** (Sybil businesses, wash/self-repayment to farm score) | High | High | 🔴 Critical | KYB-gate identity; make cost-of-attack > reward; score rewards **net external** on-time repayment; round-trip self-funding is score-neutral; detect funder↔business collusion patterns off-chain | Open — Stage 4 |
| R-02 | **State archival** — persistent Passport/score entries archived on TTL expiry; reputation "lost" between loans | Medium | High | 🔴 Critical | TTL subsystem: `bump_ttl`, restore path and TTL headroom monitoring | Open — Stage 3 |
| R-03 | **Custody / regulatory** (money transmission / securities in Peru/LatAm) | Medium | High | 🟠 High | Non-custodial contract escrow (ADR-0006); testnet-only MVP; legal review before mainnet; SDP/anchor + licensing considered only post-MVP | Open — legal track |
| R-04 | **KYB is hard** (real KYB needs an authorized evidence source and review policy) | High | High | 🔴 Critical | Keep sandbox pending; design Peru evidence, consent, reviewer permissions, retention and outage handling before accepting a business | Open — Stage 2 |
| R-05 | **Oracle manipulation / staleness** (Reflector) affecting valuation/FX | Low (current scope) | High | 🟡 Medium | Keep initial flow single-asset (no FX); if FX is added, require freshness checks and sanity bounds | Deferred — future integration |
| R-06 | **Blend dependency** (risk params, pool mechanics) | Medium | Medium | 🟡 Medium | Keep Passport/score independent of a lending provider; prove the core flow before integration | Deferred — future integration |
| R-07 | **Smart-contract bugs** (reentrancy on release, auth gaps) | Medium | High | 🟠 High | Review every state-changing auth path and token call; property tests, reproducible builds and independent review before value transfer | Open — Stages 3–4 |
| R-08 | **Admin key compromise** (score/passport writer roles) | Low | High | 🟡 Medium | Multisig/threshold admin, key rotation, least-privilege writer roles, event monitoring/alerts | Open — Stage 3 |
| R-09 | **Scope creep** (building a money market, AI, mobile, secondary market) | High | Medium | 🟠 High | Stage gates in the active roadmap; keep agentic payments to one bounded verification pilot | Open — manage per stage |
| R-10 | **Off-chain PII breach** (KYB documents and profile data) | Medium | High | 🔴 Critical | Minimize collection, encrypt at rest, least access, off-chain retention and incident response; only a commitment on-chain | Open — Stage 2 |
| R-11 | **Unverified Stellar product claims** (compiled contracts mistaken for deployed, reconciled flows) | Medium | Medium | 🟠 High | Require contract IDs, event/index reconciliation and dated Testnet evidence before claiming on-chain operations | Open — Stage 3 |
| R-12 | **Sandbox trust promotion** (format checks mistaken for real KYB or credit approval) | High | High | 🔴 Critical | PR #13 keeps new sandbox submissions pending and gates new financing; review legacy accepted rows and every trust-bearing read/write before release | Contained in draft; production exposure requires audit |
| R-13 | **Stranded investor funds** (existing partially funded opportunities blocked by a new eligibility gate) | Medium | High | 🔴 Critical | Inventory `Open` opportunities and ledger balances; approve and test a reconciled cancel/refund or grandfathering path before rollout | Open — Stage 1 release blocker |
| R-14 | **Schema/code mismatch** (new underwriting table queried before migration) | Medium | High | 🔴 Critical | Verify migration in isolated Development, check duplicates for the partial unique index, migrate before app deployment, retain rollback plan | Open — Stage 1 release blocker |
| R-15 | **Agent overspend or false evidence** | Medium | High | 🔴 Critical | Testnet-only pilot; provider/asset/network allowlists, spend caps, scoped signer, replay store, signed evidence and human review | Planned — Stage 5 |
| R-16 | **Sensitive KYB exposure** (raw documents, predictable commitments or broad reviewer access) | Medium | High | 🔴 Critical | Minimize collection, use salted commitments, off-chain encrypted evidence, access logs, retention and vendor review | Partially mitigated in draft; policy pending |

## Monitoring plan

Before live value transfer, index contract events and alert on anomalous score deltas, large or rapid fundings, repeated funder↔business pairs, TTL nearing expiry and privileged calls. Add database health, KYB/underwriting queue age, ledger variance and chain reconciliation lag. Define alert owner and response runbook for each signal.
