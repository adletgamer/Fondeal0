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

---

## Calendar roadmap — next 4 months

Where the phase table above maps work to the SCF tranche structure, this maps
the *same* work to a calendar so it's obvious what ships when. Baseline: the
web MVP is live (`fondealo.vercel.app`), both Soroban contracts are built and
tested (Phases 3–5 done), and the funding-flow backend (Prisma + Server
Actions for create/list/fund an opportunity) has just landed behind a
DB-unreachable-safe fallback — no production Postgres is provisioned yet.

### Month 1 — Make it real (finish Phase 6, start Phase 7)
- Provision a real Postgres (Neon/Vercel Postgres), run `prisma migrate deploy`,
  retire the demo-data fallback on the investor dashboard.
- Deploy `business_passport` + `credit_score` to Testnet (`scripts/deploy_testnet.sh`)
  and wire the read side: dashboards read the real Passport/score instead of
  the hardcoded demo passport.
- SEP-10 wallet auth: replace the "paste your Stellar address" form fields
  with a real signed session, so Business/Investor identity comes from the
  connected wallet, not free text.
- Ship `loan_escrow` (or equivalent) contract skeleton + tests: this is the
  on-chain counterpart of the `fundOpportunity`/repay flow already scaffolded
  off-chain.
- **Exit gate:** a business can connect a wallet, get a real on-chain
  Passport, open an opportunity, and an investor can fund it in testnet
  USDC — end to end, no demo data.

### Month 2 — Close the loop (finish Phase 7)
- Wire repayment: `repayOpportunity` Server Action + on-chain settlement via
  `loan_escrow`, feeding the `credit_score` contract so a repayment actually
  moves the score and risk band.
- Cross-loan persistence: confirm reputation survives loan #1 → loan #2 with
  a scripted demo (this is the product's core differentiator claim — it needs
  a recorded proof, not just a claim).
- TTL bumper job for Soroban storage (contract state expiry) so long-lived
  Passports don't silently disappear.
- Threat model + monitoring plan draft (SCF-required for Tranche 2).
- **Exit gate:** a scripted demo shows one business completing two loan
  cycles with a visibly improving score/risk band.

### Month 3 — Composability + hardening
- Blend integration spike: route funded USDC into a Blend pool instead of
  idle escrow, or accept Blend as a funding source — whichever the spike from
  ADR-0003 recommends.
- DeFindex yield spike for idle investor USDC between fundings.
- Security pass: fix findings from the Month 2 threat model, add contract
  fuzz/property tests beyond the current unit tests, external review if
  budget allows.
- Basic ops: error tracking + uptime monitoring on the Vercel app, structured
  logs on Server Actions, an on-call-readable runbook for "DB down" /
  "Soroban RPC down" (the two single points of failure today).
- **Exit gate:** at least one money-lego integration live on testnet; no
  open Sev-1/Sev-2 findings from the security pass.

### Month 4 — Demo Day readiness (Phase 8)
- Polish the landing/dashboards with real usage data instead of the current
  hero copy assumptions; bilingual (EN/ES) pass on every screen, not just the
  landing page.
- Record the demo video / live walkthrough for SCF submission.
- Metrics dashboard: opportunities created, USDC funded, repayment rate,
  average score delta — the "committed on-chain metrics" Tranche 3 needs.
- Freeze scope, triage `docs/backlog.md`, and submit the SCF Build Award
  application with the recorded metrics.
- **Exit gate:** SCF-ready submission package (demo video, live app, metrics,
  audited contracts or audit-in-progress note).

### What's explicitly out of scope for the first 4 months
Mainnet launch, a full KYB provider integration (SEP-12 shape is modeled, a
real vendor is not wired), and non-USDC assets. These are Tranche 3 /
post-SCF concerns and pulling them forward would slow down the Month 1–2
exit gates above.
