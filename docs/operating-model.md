# Fondealo operating model

**Snapshot:** 2026-10-11. This document describes the repository and the release gates for the draft [business underwriting PR #13](https://github.com/adletgamer/Fondeal0/pull/13). It is not evidence that the draft has been merged, migrated or deployed.

## Product truth

Fondealo is building business identity, underwriting and financing infrastructure for small businesses, initially in Peru. The public website and authenticated app exist. The financing experience currently uses a database-backed **test ledger**; its balances must not be described as redeemable USDC or as settled on Stellar. Soroban contracts compile and pass CI, but this repository does not document deployed contract IDs or a reconciled production issuance flow.

| Capability | Current evidence | Product claim allowed |
| --- | --- | --- |
| Privy sign-in, persistent Business/Investor role | Implemented in the app; a user reported successful sign-in on the official site | Account access, subject to runtime availability |
| Business registration | Intake stores a sandbox KYB submission | Application received; **not** verified |
| KYB and underwriting | PR #13 keeps sandbox submissions `Processing` and adds an unused decision model and financing gate | No real verification or credit approval is available yet |
| Business Passport | Soroban contract and database projection exist; automatic issuance and reconciliation do not | Prototype credential, not a live verified Passport |
| Funding and repayment | Server actions and an append-only test ledger exist; PR #13 blocks new financing without real KYB and underwriting | Test flow only; no claim of live capital settlement |
| Agentic verification payments | Architecture and pilot plan only | Concept / planned Testnet pilot |

The source of truth for any release claim is a dated demonstration against the **target environment**, plus database and chain evidence where relevant. Passing tests or deploying a Vercel preview does not prove that a production workflow works.

## Trust states and authority

`Submitted → IdentityReview → IdentityVerified → RiskReview → RiskApproved → IssuancePending → PassportActive` is the target business journey. `NeedsInformation`, `Rejected`, `Suspended`, `Revoked` and `ReviewDue` require explicit handling. Today only sandbox intake and the fail-closed financing check from PR #13 are implemented; there is no reviewer action that legitimately advances a new applicant to `PassportActive`.

Identity verification, underwriting, Passport issuance and opportunity approval are distinct decisions. Every decision must reference the business, verified actor, evidence, policy version, reason codes, time and expiry. A successful payment for data is evidence acquisition, never approval. A Passport is not a lending commitment.

The server derives actor identity and role from the verified session. It must enforce ownership, current KYB, decision limits and expiry on every trust-bearing mutation. An unavailable provider or database results in review or a blocked operation. Existing repayment obligations remain accessible during review; stopping new funding must not strand investor or business balances.

## Data and security boundaries

- Keep tax identifiers, documents, reviewer notes and salts off-chain. Publish only a minimal commitment after a reviewed issuance process. Grant access by function, log sensitive reads and define retention before collecting additional evidence.
- Use an append-only record for financial movements and decision history. Reconcile balances and contract events before reporting financial metrics. Never infer settlement from a UI success message alone.
- Separate Production, Preview and Development databases and keys. Use the isolated Development database for synthetic tests. Never copy production personal or financial records into a demo.
- No model or autonomous agent receives raw wallet keys. A payment pilot needs provider, asset, network and spend allowlists; per-call and daily caps; idempotency; replay protection; and a human escalation path.
- Production migration, contract deployment, live asset transfer and policy activation require separate review and authorization. Do not weaken TLS or bypass network controls to make a check pass.

## Release gates

| Gate | Required evidence | Blocker owner (function, not assigned person) |
| --- | --- | --- |
| Code review | Focused diff, threat analysis, tests for authorization, financial invariants and failure states; CI green | Engineering / Security |
| Database | Migration reviewed and applied to isolated Development; migration status, rollback plan and preflight for duplicate `Processing` KYB | Database / Engineering |
| Existing obligations | Inventory `Open` and partially funded opportunities; ledger-reconciled cancel/refund or grandfathering decision | Product / Finance / Engineering |
| KYB policy | Peru evidence sources, consent, reviewer authority, adverse/appeal path, retention and applicable legal review | Risk / Legal |
| Chain readiness | Contract auth and lifecycle review, Testnet issue/revoke/TTL tests, event indexing and reconciliation | Soroban / Security |
| Production release | Explicit approval, target-environment smoke tests, monitoring, rollback operator and incident contact | Release owner |

The draft PR must not be merged or deployed merely because CI passes. Apply the additive migration before application code that queries its new table. No production migration or deployment was performed for PR #13.

## Operating cadence and evidence

- Maintain one issue or decision record per material product/security change: problem, owner, scope, alternatives, acceptance test and rollback. Use an ADR for a durable architecture decision.
- Update this snapshot and [the roadmap](roadmap.md) at each release gate. Mark every claim as **concept**, **sandbox**, **Testnet** or **live** in user-facing material.
- Track operational measures only after instrumentation and reconciliation exist: intake completion, KYB review time, approval/decline reasons, decision expiry, funding conversion, repayments, defaults, ledger variance and chain reconciliation lag. Do not publish invented or unreconciled numbers.
- For an incident, first protect new money movement, preserve logs and ledger evidence, assess affected users/obligations, then restore service under a reviewed plan. See [deployment and database runbook](deployment-and-database.md).

## Related documents

- [Business approval, Passport and agentic verification strategy](strategy/business-onboarding-underwriting-agentic-payments.md) — target design and Stage 1 limits.
- [Roadmap](roadmap.md) — current ordered delivery gates.
- [Risk register](risks.md) — material failure modes.
- [Architecture draft](architecture.md) and [ADRs](adr/) — historical decisions; verify implementation before relying on a proposal.
