# ADR-0011: Admin back-office and decision authority

**Status:** Proposed, 2026-10-22. Increment 1 (design, workflow rules, fail-closed access) is implemented in `apps/admin`. Later increments are gated below. This is not approval to handle real documents, deploy contracts or issue Passports.

## Context

Someone has to approve KYB cases, and eventually something has to sign on-chain transactions. Putting either behind the public app's login would let a bug in the public site reach personal data or contract roles. The operating model already requires that no sandbox result can become a verified Passport and that identity, underwriting and Passport issuance remain separate decisions.

## Decision

Three privilege planes, each with its own surface and keys.

| Plane                         | Does                                               | Lives in                                                                     | Never                                                |
| ----------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Contract admin**            | Rotate roles, pause, transfer admin                | Stellar multisig account (target 2 of 3), operated by CLI or hardware key    | In any web app                                       |
| **Issuer and keeper signers** | `issue`, `freeze`, `revoke`; `default` after grace | A signing worker, one key per role and environment, secrets outside the repo | In the browser, the public app or the back-office UI |
| **Back-office**               | Review KYB cases, record decisions                 | `apps/admin`: its own app, deployment, domain and secrets                    | Linked from the public site; sharing cookies with it |

`apps/admin` shares `@fondealo/database` and the design tokens with the public app and nothing else at runtime. Its only path to the chain is a queue of approved actions (below).

## Decision authority

1. A human decides. The system never moves a case to Approved by itself, and provider output, a sandbox pass or a declaration is never enough.
2. **Reviewer** may claim a case and ask for information. **Approver** may also approve, reject and reopen. A single person may hold both roles.
3. Every decision records the case, the actor, the policy version, reason codes, the evidence sources used, the time and an expiry, and is append-only. The stored `KybStatus` is derived from the latest decision (`Approved` is the only `Accepted`).
4. A decision is validated by one pure function (`validateDecision`) that the screen runs for guidance and the server runs as the authority. Rules live in code and in [KYB policy v1](../kyb/policy-v1.md).
5. KYB approval is not underwriting approval. The existing `canRequestFinancing` gate stays: it requires a non-sandbox provider on the KYB record, a current underwriting decision and a matching Passport projection.
6. With one operator there is no four-eyes control. Compensating controls: a cancellable cooling-off window before any on-chain issuance, notice to a second contact, and a policy field for two approvals that can be switched on without redesign.

## Staff access

Allowlist table (`StaffMember`: identity, role, active), mandatory second factor, short sessions, re-authentication to approve, `__Host-` cookie, per-request nonce CSP, `no-store`, `noindex`, no framing. Every read of a full tax number and every decision writes a `VerificationAuditEvent`. Until staff authentication ships, the example-data preview is the way in: it is on in local development, in Vercel preview deployments and wherever `ADMIN_ENV=testnet`, serves only fictional fixtures and stores nothing. On a production deployment it is off and access fails closed: no session means redirect to `/sign-in`. Increment 2 must keep the preview from ever reading real data.

## Approved decision to chain

An approval creates an `OnchainAction` row (kind, business, decision, idempotency key, state). A worker holding the issuer key re-checks that the decision is current, waits out the cooling-off window, signs, confirms in the ledger and reconciles. Any mismatch alerts and halts; nothing is retried blindly. The worker is the only holder of the issuer key.

## Increments

| #   | Scope                                                                                                                                              | Exit evidence                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | Design, case queue and detail, decision panel on example data, state machine, reason codes, fail-closed access, security headers. **Implemented.** | Unit tests for every decision rule, middleware and CSP; typecheck, lint, build                      |
| 2   | Staff authentication and allowlist, additive migration (`StaffMember`, `KybDecision`), database-backed reader, masked tax ID with audited reveal   | Migration applied to isolated Development; negative tests for unauthenticated and wrong-role access |
| 3   | Persist decisions through server actions that re-run `validateDecision`; audit events; applicant-facing status updates                             | Decision history immutable; a rejected or stale input never changes state                           |
| 4   | `OnchainAction` queue, signing worker, cooling-off, reconciliation and alerts                                                                      | Testnet issue and revoke reconciled; killing the worker mid-flight leaves no duplicate or orphan    |
| 5   | Underwriting decision screen, expiry and review-due handling, second-approver option                                                               | Expired approval returns to review; financing gate unchanged                                        |

## Consequences

- A second Next.js app to build, deploy and monitor, in exchange for isolation of personal data and signing authority.
- The Tailwind config currently imports the public app's config. Lift it into a `packages/ui` preset when a third consumer appears.
- Production keeps `reviewer-attested` evidence disabled until Legal accepts the policy; Testnet allows it so approvals can be exercised end to end.

## Open decisions for the owner

See the end of [KYB policy v1](../kyb/policy-v1.md).
