# ADR-0011: Admin back-office and decision authority

**Status:** Proposed, 2026-10-22; revised the same day (Privy authenticates, Fondealo authorizes; maker-checker; decision records; credential anchoring). Increments 1 and 2a are implemented in `apps/admin` and `packages/database`. Later increments are gated below. This is not approval to handle real documents, deploy contracts or issue Passports.

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
2. **Privy authenticates; Fondealo authorizes.** A verified Privy access token is only a claim of identity. Access comes from an `Active` `StaffMember` row keyed by the Privy user id (the token's subject), never by email, and from the permission table in `apps/admin/src/lib/kyb/authz.ts`. A person who can sign in to Privy but has no active row gets nothing.
3. **Roles.** A person may hold several.

   | Role | May |
   | --- | --- |
   | Reviewer | Read cases, claim, ask for information, reveal a full tax number (audited) |
   | Approver | Everything a Reviewer may, plus approve, reject and reopen |
   | Admin | Manage staff only. Does not read cases or decide unless the person also holds those roles |

   Nobody changes their own access, and the last active Admin cannot be suspended or demoted. Policies are **not** editable from the back-office: a policy is versioned code plus its document, changed by pull request, so `policyVersion` always points at reviewable rules.
4. **Separation of duties (maker-checker).** Whoever claimed and prepared a case may not approve or reject it. Enforced in code (`validateDecision`) and in the database (`KybDecision_maker_checker`). Production always enforces it. On Testnet a single operator may run `solo` (the default there until a second person joins); every such decision records `separationMode = 'solo'`, and the screen says so.
5. **Every decision is a record**, append-only (a trigger rejects `UPDATE` and `DELETE`): case, submission, kind, from and to state, actor, preparer, separation mode, `policyVersion`, reason codes, checklist answers with sources, `evidenceSnapshotHash`, time, and an expiry for approvals. The stored `KybStatus` is a projection of the latest record (`Approved` is the only `Accepted`).
6. **`evidenceSnapshotHash`** is the SHA-256 of a canonical (sorted-key) JSON of what the reviewer saw: the evidence list with sources, provider checks, the checklist and the intake's own commitment. Evidence may change later; the record proves what the decision was based on.
7. A decision is validated by one pure function (`validateDecision`) that the screen runs for guidance and the server runs as the authority.
8. KYB approval is not underwriting approval. The existing `canRequestFinancing` gate stays.

## Staff access

- **Separate Privy app for staff.** Its own app id and secret, apart from the customer app, so customer identities and staff identities never share a pool and the staff app can have its own login methods.
- **Server-side verification on every request.** Verify the access token with Privy's server SDK (`verifyAuthToken`), look up `StaffMember` by the token subject, require `Active`. Never trust a client flag.
- **Second factor.** Privy's MFA, as documented, protects the use of embedded-wallet keys, not the sign-in, and a session token does not say which method was used. Privy also cannot create an account from a passkey; a passkey must be linked to an existing account. So `mfaRequired` is enforced by Fondealo: a decision or staff change requires a fresh WebAuthn assertion that Fondealo verifies against a passkey registered to that `StaffMember` (step-up). Increment 3.
- **Bootstrap.** While no active Admin exists, one sign-in whose Privy account has a verified email equal to `ADMIN_BOOTSTRAP_EMAIL` creates the first Admin, and the event is audited. After that the variable is ignored. Email is used only for this one-time bootstrap, never to authorize.
- Short sessions, `__Host-` cookie, per-request nonce CSP, `no-store`, `noindex`, no framing. Staff access changes and full tax-number reveals write a `StaffAuditEvent` (append-only).
- Until staff authentication ships, the example-data preview is the way in: on in local development, Vercel preview deployments and wherever `ADMIN_ENV=testnet`; it serves only fictional fixtures and stores nothing. On a production deployment it is off. The preview must never read real data.

## Approved decision to chain

The back-office is the root of trust of the Passport's KYB credential. No KYB evidence is published.

| On-chain (Passport contract, `add_credential`) | Off-chain (database) |
| --- | --- |
| `kind = KYB`; `issuer` and `issued_at` (set by the contract); `status`; `data_hash` = the credential commitment | Tax number, representative, documents, sources, reviewer notes, the decision record, the commitment salt |

The **credential commitment** is SHA-256 over canonical JSON of the decision id, `policyVersion`, `evidenceSnapshotHash`, issue and expiry times and a random 32-byte salt that never leaves the server (same scheme as the intake's `dataHash`). Whoever is given the record and the salt can recompute it and compare it with the chain; nobody can derive anything about the company from it. The subject is the Passport's own Stellar address, so no hash of the company's identity goes on-chain: a tax number is enumerable, and a salted hash of it would add nothing.

Two contract gaps to close in Phase 1 (the contracts are not deployed, so this costs no migration): the credential has no `expires_at`, so a verifier cannot check expiry on-chain; and a credential kind can exist only once per business, so renewal is revoke then add. `policyVersion` stays inside the commitment and the off-chain record.

An approval creates an `OnchainAction` row. A worker holding the issuer key re-checks that the decision is current, waits out the cooling-off window, signs, confirms in the ledger and reconciles. Any mismatch alerts and halts. The worker is the only holder of the issuer key.

## Increments

| # | Scope | Exit evidence |
| --- | --- | --- |
| 1 | Design, queue and case detail on example data, state machine, reason codes, fail-closed access, security headers. **Implemented.** | Unit tests for every decision rule, middleware and CSP |
| 2a | Roles and permissions, maker-checker, decision record with `policyVersion` and `evidenceSnapshotHash`, credential commitment; additive migration (`StaffMember`, `KybDecision`, `StaffAuditEvent`) with check constraints and append-only triggers. **Implemented.** | Unit tests; every migration applied in order to an embedded Postgres in CI with the invariants tested; not yet applied to any hosted database |
| 2b | Separate staff Privy app, server-side token verification, `StaffMember` lookup, bootstrap, database-backed reader, audited tax-number reveal | Migration applied to isolated Development; negative tests for unauthenticated, unknown, suspended and wrong-role users |
| 3 | Persist decisions through server actions that re-run `validateDecision`; WebAuthn step-up; applicant-facing status | A rejected, replayed or stale input never changes state |
| 4 | `OnchainAction` queue, signing worker, cooling-off, reconciliation; contract `expires_at` | Testnet issue and revoke reconciled against the commitment |
| 5 | Underwriting decision screen, expiry and review-due handling | Expired approval returns to review; financing gate unchanged |

## Consequences

- A second Next.js app to build, deploy and monitor, in exchange for isolation of personal data and signing authority.
- The Tailwind config currently imports the public app's config. Lift it into a `packages/ui` preset when a third consumer appears.
- Production keeps `reviewer-attested` evidence disabled until Legal accepts the policy; Testnet allows it so approvals can be exercised end to end.

## Open decisions for the owner

See the end of [KYB policy v1](../kyb/policy-v1.md).
