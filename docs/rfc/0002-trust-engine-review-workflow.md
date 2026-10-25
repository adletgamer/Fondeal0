# RFC-0002: Trust Engine review workflow

**Status:** Proposed for the local KYB console prototype
**Date:** 2026-10-24

## Intent

The Trust Engine is a decision-support workflow for the Legal, Compliance and Risk team. It organizes provenance, policy gates and reviewer evidence around a KYB case. It does not make autonomous KYB or credit decisions.

The console must make an incomplete case visibly incomplete. A format-only sandbox result cannot become a verified business, a credit recommendation or a Passport issuance.

## Review stages

| Stage | Required source | Possible local state | Gate before the next stage |
| --- | --- | --- | --- |
| 1. Identity and mandate | Applicant declaration and reviewer-confirmed mandate | `Declared`, `Needs review`, `Confirmed` | The reviewer can identify the person acting for the company. |
| 2. Legal existence | Authorized registry or an approved verifier | `Unavailable`, `Pending`, `Verified`, `Mismatch` | Legal name and registration match the source. |
| 3. Beneficial ownership | Evidence and a policy-approved ownership source | `Unavailable`, `Pending`, `Verified`, `Escalate` | Required owners are identified and review rules are met. |
| 4. Risk screening | Authorized sanctions, PEP and adverse-media provider | `Unavailable`, `Clear`, `Hit`, `Escalate` | A policy-defined result is current and any hit has a recorded disposition. |
| 5. Underwriting | Versioned policy and permitted financial evidence | `Not eligible`, `In review`, `Recommend limits`, `Decline` | KYB is current, evidence references are complete, reviewer authority is valid and all constraints pass. |

## Decision contract

An underwriting recommendation needs an immutable record containing:

- the KYB submission and data commitment being evaluated;
- evidence reference IDs and provider check IDs;
- policy version, reason codes, recommended amount/term and expiry;
- reviewer identity, reviewer role and any second-reviewer approval;
- timestamped audit events for access, assignment, evidence reading, transition and final action.

An approval can be made only after the required verification sources are available and the policy owner enables the relevant country and product. A provider timeout, missing source, expired check, missing consent or failed chain transaction fails closed.

## Local prototype boundary

`apps/admin` renders the five stages with synthetic records. It has no staff auth, database access, provider calls, upload/read capability, approval control or issuer key. Its role is to validate the reviewer experience and explain the system boundary for Meridian.

## Next implementation slice

1. Introduce a distinct staff principal and server-side permission checks.
2. Add append-only staff access and decision audit events.
3. Replace synthetic queue reads with an isolated Development database only.
4. Implement assignment and request-for-information before decision controls.
5. Add approved provider adapters and policy versioning before enabling any KYB decision.
