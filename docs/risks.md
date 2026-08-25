# Fondealo — Risk Register

Severity = Likelihood × Impact. Owner = CTO unless delegated. This register is a Build-Award tranche-2 input (threat model + monitoring).

| ID | Risk | Likelihood | Impact | Severity | Mitigation | Status |
|---|---|---|---|---|---|---|
| R-01 | **Reputation gaming** (Sybil businesses, wash/self-repayment to farm score) | High | High | 🔴 Critical | KYB-gate identity; make cost-of-attack > reward; score rewards **net external** on-time repayment; round-trip self-funding is score-neutral; detect funder↔business collusion patterns off-chain | Open — design in score spec (Phase 5) |
| R-02 | **State archival** — persistent Passport/score entries archived on TTL expiry; reputation "lost" between loans | Medium | High | 🔴 Critical | TTL subsystem: `bump_ttl`, demo bumper in `scripts/`, documented restore path; monitor TTL headroom | Open — Phase 4/7 |
| R-03 | **Custody / regulatory** (money transmission / securities in Peru/LatAm) | Medium | High | 🟠 High | Non-custodial contract escrow (ADR-0006); testnet-only MVP; legal review before mainnet; SDP/anchor + licensing considered only post-MVP | Open — legal track |
| R-04 | **KYB is hard** (real KYB needs a vendor/anchor, not a weekend build) | High | Medium | 🟠 High | MVP mock/manual KYB behind a **SEP-12-shaped** interface so a real provider drops in later | Open — Phase 4 |
| R-05 | **Oracle manipulation / staleness** (Reflector) affecting valuation/FX | Low (MVP) | High | 🟡 Medium | Keep MVP USDC-denominated (no FX); when FX added, use freshness checks, sanity bounds, TWAP | Deferred — Phase 6+ |
| R-06 | **Blend dependency** (roadmap, risk params, pool mechanics) | Medium | Medium | 🟡 Medium | Escrow-first MVP decouples us; Passport/score independent of money layer; spike Blend before committing | Open — Phase 7 |
| R-07 | **Smart-contract bugs** (reentrancy on release, auth gaps) | Medium | High | 🟠 High | `require_auth` everywhere; property/fuzz tests; reproducible builds + published Wasm hashes; Audit Bank before mainnet | Open — Phases 4–8 |
| R-08 | **Admin key compromise** (score/passport writer roles) | Low | High | 🟡 Medium | Multisig/threshold admin, key rotation, least-privilege writer roles, event monitoring/alerts | Open — Phase 3+ |
| R-09 | **Scope creep** (building a money market, AI, mobile, secondary market) | High | Medium | 🟠 High | Hard MVP non-goals (see architecture §9); phase gates with approval | Mitigated by process |
| R-10 | **Off-chain PII breach** (KYB documents in Postgres) | Low | High | 🟡 Medium | Encrypt at rest, least access, only `data_hash` on-chain, retention policy | Open — Phase 4 |
| R-11 | **Prize misalignment** (superficial Stellar use) | Low | High | 🟡 Medium | On-chain score+passport = core value; composability with Blend/Reflector/DeFindex; open-source contracts; mainnet metrics committed | Actively managed |

## Monitoring plan (tranche-2 requirement, expands in Phase 7)
Index all contract events → alert on: anomalous score deltas, large/rapid fundings, repeated funder↔business pairs (collusion), TTL nearing expiry, admin-role calls, failed `require_auth` attempts.
