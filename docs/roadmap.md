# Fondealo roadmap

**Snapshot:** 2026-10-11. This replaces the original phase/calendar proposal as the active engineering sequence. Dates, funding milestones and production launch commitments are intentionally unset until prerequisites are evidenced. See the [operating model](operating-model.md) for current capability claims.

## Delivery order

| Stage | Outcome | Current state | Exit evidence |
| --- | --- | --- | --- |
| 0. Baseline | Reproducible web and Soroban CI; protected auth, roles and ledger behavior | Implemented; CI green for [merged PR #13](https://github.com/adletgamer/Fondeal0/pull/13) | Node format/lint/types/tests/build and Soroban fmt/clippy/tests/WASM green on the release commit |
| 1. Trust containment | Sandbox KYB cannot create a verified Passport or finance a new opportunity | Code merged to `main`; database and Production rollout unverified | Migration tested in isolated Development, legacy data inspected, existing obligations reconciled, security review complete |
| 2. Peru KYB and underwriting | Evidence-backed identity decision and explainable, versioned risk decision | Design only; back-office design, workflow rules and fail-closed access in `apps/admin` on example data ([ADR-0011](adr/0011-admin-back-office-and-decision-authority.md)); no decision is persisted yet | Authorized data source, consent/retention and legal review; reviewer authorization; adverse/review reasons; expiry and limits; negative tests |
| 3. Passport lifecycle on Testnet | Issue, revoke, renew and read a nontransferable credential with durable event reconciliation | Contract code exists; application issuance/indexer pending | Contract auth review, compatible toolchain, Testnet IDs, idempotent issuance, event cursor, TTL restoration, independent verification |
| 4. Financing integration | Reconciled new funding and repayment linked to current eligibility | Test ledger and server actions exist; live settlement pending | End-to-end synthetic Testnet flow, money conservation, ownership and rollback tests, no orphaned funds |
| 5. Agentic verification pilot | One bounded paid data check for underwriting | Concept only | One approved provider, synthetic data, Testnet budget, allowlists, idempotent receipt and evidence review; no automatic approval |
| 6. Live readiness | Operate with real businesses or money | Not approved | Independent security/contract review, legal/vendor approvals, incident runbooks, reconciled metrics and explicit release authorization |

Stages 2–5 may have small parallel research tasks, but a later stage cannot be called live because an earlier trust or money gate is missing. Do not upgrade dependencies, deploy contracts, apply Production migrations or move real value as a side effect of this roadmap.

## Stage 1 release checklist

- [x] Sandbox intake stays `Processing`; no automatic Passport projection or starting score.
- [x] New opportunity creation and funding require real reviewed KYB, current underwriting approval and a matching Passport projection.
- [x] Existing repayment access remains available.
- [x] Local regression checks and PR CI pass.
- [ ] Count legacy `Processing` submissions per business; resolve duplicates before the partial unique index.
- [ ] Apply and verify the additive migration on the isolated Development database; confirm Prisma migration history.
- [ ] Inventory `Open` and partially funded opportunities; approve a ledger-reconciled cancel/refund or grandfathering plan.
- [ ] Review the failure mode when the new table is absent and the order of migration then application deployment.
- [ ] Review security, product messaging and rollback; decide separately whether to deploy.

A green CI build is evidence for code quality, not for database compatibility, production identity decisions or safe treatment of existing investor funds.

## Stage 2 design decisions to record

1. Define the first Peru operating product and applicable legal obligations with qualified local review.
2. Select authorized RUC, representative and ownership evidence sources; document permitted use, freshness and outage behavior.
3. Define a proportionate KYB policy and a separate underwriting policy with version, exposure/term caps and reason codes.
4. Design least-privilege reviewer actions, four-eyes control for exceptions, immutable audit events and appeal/re-review.
5. Specify the migration from legacy sandbox records without automatic promotion.
6. Define measurable decision quality before using a score as a financial claim.

## Stage 3–5 technical gates

- Passport: no transfer/approval path; authorized issuer/admin; freeze/revoke; KYB status checked by consumers; storage TTL and restoration; event replay and reorg-safe reconciliation.
- Financing: server and contract enforce the same eligibility and ownership; no client-first value transfer; exact monetary units; idempotent transaction and payout; ledger-to-chain reconciliation.
- Agentic payments: approved provider and evidence schema, minimal data, consent, per-call/daily caps, allowlisted asset/network/recipient, replay store and verified settlement. A paid response routes to underwriting review.

## Planning discipline

Each stage gets an owner, issue/ADR, test evidence and rollback before release. Report status as **concept**, **sandbox**, **Testnet** or **live**. Publish metrics only after their source and reconciliation are documented. Historical research and earlier phase assumptions remain in Git history and the [documentation index](README.md).
