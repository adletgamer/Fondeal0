# Roadmap: KYB review console

**Status:** Proposed roadmap, 2026-10-24
**Purpose:** Give Fondealo Legal, Compliance, Risk and Operations a controlled way to review business applications, record decisions and manage the resulting trust credential.

**Progress:** A local-only UI prototype now exists in `apps/admin` on branch `feat/kyb-review-console`. It uses synthetic fixtures, has no database or auth integration, and exposes no decision actions. The prototype now visualizes the proposed five-stage [Trust Engine workflow](rfc/0002-trust-engine-review-workflow.md) and its policy gates. It is not a staff tool or production feature.

**Evidence slice (2026-10-25):** Added a server-only x402 acquisition module for one fixed synthetic Peru entity check, bounded Testnet USDC spend policy, Ed25519 response verification, idempotent persistence design and an additive migration. Its policy/orchestration/signature tests pass. The migration is not applied, there is no live x402 route, and the admin UI cannot invoke spending because staff auth, permissions, maker-checker and a verified isolated Development database are still absent. Details: [RFC 0003](rfc/0003-evidence-acquisition-x402.md).

## Recommendation

Build the internal console as `apps/admin` in this monorepo and deploy it as a separate Vercel project on a staff-only hostname. Reuse the shared types, database package and server-side domain logic; keep its authentication, routes, deployment settings and environment variables separate from `apps/web`. This gives the review surface its own access boundary without duplicating the KYB data model or creating a second product repository.

Do not use the existing Business/Investor role as staff authorization. The current Privy session has only those two roles, and the current middleware only protects those product areas. Add a staff identity and explicit permissions, checked on every page read and server mutation. A hidden `/admin` URL or client-side role check is not access control.

## Current baseline

- The web app accepts KYB declarations and stores submissions, evidence references, provider checks, consent and audit events in Postgres.
- Uploads are disabled. The sandbox checks formats only; submissions stay `Processing`. It cannot approve KYB, underwriting or Passport issuance.
- `UnderwritingDecision` records a versioned decision shape, but no staff review console or staff authorization exists.
- The Passport contract is intended to hold trust-bearing facts; personal and KYB data stays off-chain. The database projection is not authoritative for on-chain state.
- The existing KYB evidence ADR requires Legal/Risk to decide retention, access and evidence policy before real documents are collected.

Therefore, the first usable milestone is a **read-only staff queue**. The current local screen is only a visual prototype; it is not yet the authenticated queue described in Phase 1. Real approval and Passport issuance remain disabled until the relevant legal, provider, security and deployment gates are satisfied.

## Delivery phases

| Phase | Scope and deliverables | Exit criteria |
|---|---|---|
| 0. Policy and access design | Legal/Risk define decision authority, supported countries and evidence, consent language, retention/deletion, adverse-action and appeal process, escalation, and when two-person approval is required. Engineering defines staff identity, roles (`reviewer`, `compliance`, `admin`), MFA/session lifetime, audit events, and threat model. Record open decisions before implementation. | Named policy owner and approved written rules; role/action matrix; data retention schedule; decision and escalation procedure; separate staff auth selected. No production data collection or approval authority is implied by this design. |
| 1. Isolated console foundation | Create `apps/admin`; separate Vercel project and hostname; staff-only sign-in with MFA and explicit allowlisting; server-side permission checks; session expiry and revocation; read-only queue for `Processing` cases with status, age, country, business name, and declared evidence summary. Add safe pagination and search. | Unauthenticated and non-staff requests are denied server-side; every case read is audited; no writes, raw document downloads, or approval actions; preview uses synthetic data and isolated Development database only. |
| 2. Case review workspace | Case detail with only fields required by policy, declarations, normalized provider checks and reason codes; evidence readiness checklist; reviewer assignment/claim; internal notes separated from customer data; request-more-information and return-to-queue actions; append-only case history. Show `sandbox` checks as format-only and never as external verification. | Ownership and permissions are enforced on every action; all access and status changes record actor, case, timestamp and reason; no secrets, raw PII or storage keys appear in logs; no document upload until the separate evidence gate is approved. |
| 3. Decision workflow and trust issuance | Implement explicit decision states and transitions, reason codes, evidence references, policy version, decision expiry and limits. Persist an immutable decision tied to the exact KYB submission. Add separation of duties or second reviewer for policy-defined cases. Only after a real authorized verification source and operating policy are approved, enable the issuer service to update the Passport on Stellar and reconcile the chain result back to the database projection. | Negative paths fail closed (provider unavailable, stale evidence, missing consent, expired decision, failed chain transaction). Approval is possible only for an eligible submission with documented evidence and authorized reviewer(s). Passport status is confirmed from chain before UI claims issuance. |
| 4. Operational rollout | Threat model and independent access-control review; audit export and retention jobs; alerts for queue age, repeated failures and privileged actions; incident and rollback runbooks; isolated Development migration and backup/restore rehearsal; staff training; limited pilot before broader access. | Named operational owners, verified migration/deployment sequence, tested recovery, access review and audit sampling. Production rollout has explicit Legal/Risk and Engineering sign-off. |

## MVP boundary

The first MVP should deliver Phases 0–2: secure staff sign-in, a read-only queue, a case review view and an auditable request-for-information workflow. Keep final KYB approval, underwriting approval and `Engine Trust` / Passport issuance turned off until Phase 3 gates pass. This lets the team improve review operations without presenting a format-only sandbox as real verification.

## Core data and security requirements

- Add a staff principal and explicit role/permission model; never add staff privileges to `UserRole` for Businesses and Investors.
- Enforce authorization in server-side loaders and mutations, with least privilege and deny-by-default behavior. Use a distinct staff auth configuration and MFA; do not rely on a shared browser session or obscurity of the hostname.
- Extend the append-only audit trail to cover case reads, evidence access, assignment, notes, status changes, decision, overrides and issuance. Capture staff subject, action, case/submission, timestamp, reason and policy version; avoid copying raw PII into audit metadata.
- Keep KYB PII and evidence off-chain. Store only the minimum trust-bearing state and commitment permitted by the existing Passport design. Treat the database projection as a cache, not the source of truth for issuance.
- Do not enable file storage until private storage, encryption, short-lived scoped access, file type inspection, malware scanning, access audit, retention enforcement and deletion verification are implemented and reviewed.
- Use synthetic data in previews. Point `apps/admin` to a proven isolated Development database until migration and access-control reviews pass. Never expose privileged database or issuer secrets to client bundles.
- Every decision must be reproducible from its submission, evidence references, reviewer identity, reason codes and policy version. No silent edits to a completed decision; supersede it with a new decision and retain the history.

## Suggested first implementation tickets

1. Approve the policy and staff role/action matrix; document country-specific review rules and retention.
2. Add staff identity/authorization and immutable staff audit events, including authorization tests.
3. Scaffold `apps/admin` and its independent Vercel Development/Preview project configuration.
4. Build a paginated, read-only KYB queue and case detail using server-only database access.
5. Add reviewer assignment and a request-information transition, with a customer-visible status and an auditable reason.
6. Review permissions, PII exposure, logs, retention and failure behavior before adding decision controls.

## Decision to revisit

Keep a single monorepo and database model, with a separate admin application and deployment. Revisit a separate repository/database only if Legal requires a hard data tenancy boundary or the staff application must be operated by a different entity. A `/admin` route inside `apps/web` is acceptable only as a short-lived prototype with synthetic data; it should not become the production reviewer surface.
