# Fondealo — Prioritized Backlog

Priority: **P0** = required for the core loop / MVP demo · **P1** = important, next · **P2** = later.
Estimates are rough (S ≤1d, M ≤3d, L ≤1w). IDs are stable references for PRs/commits.

## Epic A — Foundation & tooling (Phase 3)
| ID | Item | Pri | Est | Depends |
|---|---|---|---|---|
| A1 | pnpm workspaces + Turborepo monorepo skeleton (`apps/web`, `packages/*`) | P0 | M | — |
| A2 | ESLint + Prettier + Husky + Commitlint (Conventional Commits) | P0 | S | A1 |
| A3 | GitHub Actions: lint, typecheck, test, `cargo build/test`, `stellar contract build` | P0 | M | A1 |
| A4 | `packages/soroban` Cargo workspace + empty contract crates + testnet deploy script | P0 | M | A1 |
| A5 | `packages/database` Postgres schema (Prisma/Drizzle) + migrations | P0 | M | A1 |
| A6 | `packages/types` shared TS types + zod schemas | P0 | S | A1 |
| A7 | `packages/sdk` RPC client + tx builder scaffold + Wallets Kit wrapper | P0 | M | A1,A6 |

## Epic B — Auth & wallets (Phase 3/4)
| ID | Item | Pri | Est | Depends |
|---|---|---|---|---|
| B1 | Stellar Wallets Kit integration (Freighter default) | P0 | M | A7 |
| B2 | SEP-10 challenge/verify endpoint + JWT session | P0 | M | B1 |
| B3 | Auth-guarded Server Actions + session context | P0 | S | B2 |

## Epic C — Business Passport (Phase 4) — DIFFERENTIATOR
| ID | Item | Pri | Est | Depends |
|---|---|---|---|---|
| C1 | `business_passport` contract: struct + persistent storage + init/issue/get | P0 | L | A4 |
| C2 | KYB intake form (SEP-12-shaped) + mock/manual review workflow | P0 | M | A5,B3 |
| C3 | Issue Passport on KYB `ACCEPTED` (kyb_status, initial score, data_hash) | P0 | M | C1,C2 |
| C4 | Passport read API + business dashboard card (status/score/risk) | P0 | M | C1,A7 |
| C5 | TTL subsystem: `bump_ttl` + `scripts/` bumper + restore path | P1 | M | C1 |
| C6 | Contract tests (auth gating, issue/read, edge cases) | P0 | M | C1 |

## Epic D — Credit Engine (Phase 5) — DIFFERENTIATOR
| ID | Item | Pri | Est | Depends |
|---|---|---|---|---|
| D1 | **Score spec** (inputs, weights, decay, anti-gaming) + ADR | P0 | M | — |
| D2 | `credit_score` contract: `on_repayment`, `on_default`, `preview` | P0 | L | D1,C1 |
| D3 | Property/fuzz tests for score transitions + anti-gaming (R-01) | P0 | M | D2 |
| D4 | Risk-band → suggested-rate mapping used by opportunities | P1 | S | D2 |

## Epic E — Funding flow (Phase 6)
| ID | Item | Pri | Est | Depends |
|---|---|---|---|---|
| E1 | `loan_escrow` contract: create/fund/release/repay + USDC SAC | P0 | L | A4 |
| E2 | Opportunity creation UI (amount, term, rate from risk_band) | P0 | M | C4,D4 |
| E3 | Investor deposit USDC (testnet faucet) → escrow | P0 | M | E1,B3 |
| E4 | Release to business on funded; repayment schedule + repay UI | P0 | M | E1 |
| E5 | Final repayment triggers `credit_score.on_repayment` + Passport update | P0 | M | E1,D2,C1 |
| E6 | Investor dashboard: positions, returns, status | P0 | M | E3 |
| E7 | Escrow contract tests (reentrancy/auth, R-07) | P0 | M | E1 |

## Epic F — Reputation persistence & composability (Phase 7)
| ID | Item | Pri | Est | Depends |
|---|---|---|---|---|
| F1 | Cross-loan persistence demo: loan #1 repaid → cheaper loan #2 | P0 | M | E5,D2 |
| F2 | Blend integration spike (curated pool) — feasibility + ADR | P1 | L | E1 |
| F3 | DeFindex idle-liquidity yield spike | P2 | M | E3 |
| F4 | Reflector price feed integration (valuation/FX groundwork) | P2 | M | — |
| F5 | Event indexer → `passport_projection` / `score_events` in Postgres | P1 | M | C1,D2,A5 |

## Epic G — Demo Day & prize (Phase 8)
| ID | Item | Pri | Est | Depends |
|---|---|---|---|---|
| G1 | Landing page (bilingual, thesis + demo CTA) | P0 | M | A1 |
| G2 | Recorded end-to-end demo (register→KYB→Passport→fund→repay→score up) | P0 | M | F1 |
| G3 | Metrics dashboard (NAV, volume, repayment rate) for tranche commitment | P0 | M | F5 |
| G4 | Threat model + monitoring plan doc (tranche-2) | P0 | M | E7,D3 |
| G5 | Open-source cleanup + reproducible build + published Wasm hashes | P0 | S | all contracts |
| G6 | Bilingual SCF pitch + submission | P0 | M | G1-G5 |

## Immediate next actions (after Phase 1 approval)
1. Approve architecture + ADRs (this PR). 2. Start Epic A (A1→A4). 3. Draft the **score spec** (D1) in parallel — it's the riskiest design and gates D2/E5.
