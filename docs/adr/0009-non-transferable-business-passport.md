# ADR-0009 — Business Passport as a non-transferable credential

- **Status:** accepted
- **Date:** 2026-09-21
- **Supersedes / extends:** [ADR-0004](0004-business-passport-storage-and-identity.md), [ADR-0006](0006-custody-and-auth-model.md)

## Context

The Business Passport is Fondealo's trust primitive: a business's credit identity that lenders
read and that must not be buyable, lendable or forgeable. We considered mirroring Ethereum's
ERC-721 / soulbound-token (SBT) pattern. Soroban does not need that detour — contracts are
arbitrary logic, and Stellar itself recommends contract tokens when standard assets don't give
the required behaviour.

## Decision

1. **Non-transferable by omission.** `BusinessPassportContract` exposes no `transfer`,
   `approve` or `transfer_from`. `Passport.owner` is set once at `issue` and no entrypoint can
   change it. The only way to "move" a Passport is `revoke` + a fresh `issue` to another business.
2. **One record per business, not one NFT per business.** The Passport is a struct keyed by the
   business address, with a contract-unique `passport_id`.
3. **Authorisation per entrypoint (`require_auth`):**

   | Entrypoint | Authorised by |
   | --- | --- |
   | `issue`, `set_kyb`, `freeze`, `unfreeze`, `revoke`, `add_credential`, `revoke_credential` | issuer |
   | `apply_reputation` (spec: `update_score`) | reputation manager (the `credit_score` contract) |
   | `update_metadata` | the Passport's owner |
   | `set_issuer`, `set_reputation_manager` | admin |

4. **Lifecycle status** — `Active`, `Frozen` (reversible suspension: readable, but score,
   metadata and new credentials are blocked), `Revoked` (terminal). `is_active(business)` lets
   other contracts gate on it without decoding the struct.
5. **Credentials** — up to 16 hash-committed claims per Passport (`kind: Symbol`), revocable and
   never deleted (audit trail). Revoking is allowed even while frozen.
6. **Identity vs trust.** The owner may restyle how the Passport *looks*; nobody may restyle what
   it *says*.
   - `metadata_uri` (owner-controlled, ≤ 256 bytes) points at off-chain identity metadata.
   - Colours, pattern and any styling are **never stored in the credit fields** on-chain. The
     web app keeps them off-chain (`Business.passportTheme/Accent/Pattern`).
   - The UI renders two layers: a themeable **identity layer** and a fixed **trust layer**
     (KYB, score, risk band, repayments, on-chain proof) that no theme can touch.

## Consequences

- A weak business cannot dress up its credit standing: colour choices only ever reach the
  identity layer, and the trust layer has fixed styling.
- Ownership can't be traded, so a reputation can't be bought — consistent with the
  anti-gaming stance of the score spec.
- The `Passport` struct gained fields (`passport_id`, `owner`, `status`, `metadata_uri`); the
  TypeScript `Passport` type and SDK decoder treat them as optional so off-chain projections and
  demo data keep working.
- Not yet wired: `loan_escrow` still reads only the risk band. It should also refuse new loans
  when `is_active` is false.

## Alternatives considered

- **ERC-721/SBT port (one token per business):** carries transfer/approval semantics we would
  then have to disable, and gives no place for status, credentials or auth roles.
- **Theme stored on-chain:** would put presentation data next to credit data and cost storage
  rent for no trust benefit.
- **Owner-editable score/metadata bundle:** rejected — the owner controls only `metadata_uri`.

## Follow-ups

- Deploy to Testnet and wire `PassportClient` write paths (issue, update_metadata).
- Serve the off-chain identity metadata referenced by `metadata_uri`.
- Gate `loan_escrow` on `is_active`.
