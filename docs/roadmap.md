# Fondealo — Technical Roadmap

Phases map to the product plan and to the SCF Build Award's three-tranche structure (final tranche = mainnet with on-chain metrics). Each phase ends at a **gate**: decisions explained, ADRs written, approval before proceeding.

| Phase | Name | Goal | Key deliverables | Exit gate |
|---|---|---|---|---|
| 1 | Research | Ground every decision in official docs + SCF signals | `docs/research.md` | ✅ this PR |
| 2 | Architecture | Opinionated system design + trade-offs | `architecture.md`, ADR-0001..0006 | ✅ this PR — **awaiting approval** |
| 3 | Scaffolding | Monorepo + tooling + CI + empty contract crates | pnpm/Turborepo, ESLint/Prettier/Husky/Commitlint, GH Actions, `packages/soroban` skeleton, testnet deploy script | CI green; `stellar contract build` passes |
| 4 | Business Passport | On-chain Passport + KYB (SEP-12 shape) + issue flow | `business_passport` contract + tests, KYB intake, Passport UI | Passport issuable & readable on testnet |
| 5 | Credit Engine | Deterministic score contract + score spec | score spec doc + ADR, `credit_score` contract + property tests | Score transitions verified by tests |
| 6 | Funding Flow | USDC escrow, opportunity, fund, release, repay | `loan_escrow` + SAC integration, investor/business dashboards | End-to-end loop on testnet with real USDC (faucet) |
| 7 | Reputation System | Score updates persist across loans; TTL subsystem; Blend/DeFindex integration path | cross-loan persistence, TTL bumper, Blend pool spike | Reputation survives loan #1 → loan #2 demo |
| 8 | Demo Day | Polished vertical demo + metrics + pitch | landing, recorded demo, metrics dashboard, bilingual pitch | SCF-ready submission |

## Milestone → tranche mapping (Build Award)
- **Tranche 1 (planning + testnet core):** Phases 3–5. Deliverable: Passport + score live on testnet, open-source contracts, threat-model draft.
- **Tranche 2 (integration + security):** Phases 6–7. Deliverable: full funding+repayment loop, cross-loan reputation, **threat model + monitoring plan** (SCF-required), Blend integration spike.
- **Tranche 3 (mainnet):** Phase 8 hardening → audit → mainnet launch with committed on-chain metrics (NAV / tx volume / repayment rate).

## Sequencing rationale
Passport (Phase 4) precedes Score (Phase 5) because the score needs an identity to attach to. Escrow-first funding (Phase 6) precedes Blend migration (Phase 7) so we control the first clean metric. TTL and Blend both land in Phase 7 because both concern reputation *durability and composability*, the product's core claim.

## Definition of Done (per phase)
Tests pass in CI · contracts build reproducibly · ADR(s) written for contested calls · docs updated · demo-able on testnet · security notes captured.
