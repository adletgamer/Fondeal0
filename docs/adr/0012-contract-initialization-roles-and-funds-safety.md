# ADR-0012: Contract initialization, roles and funds safety before Testnet

**Status:** Accepted, 2026-10-23. Implemented in `packages/soroban`. The contracts were never deployed, so the ABI changes below cost no migration.

## Context

Before the first Testnet deployment, a review of the three contracts found:

1. All three had a public `init` with no authorization. Between deployment and initialization, anyone could call it first and take admin, issuer or keeper; on `loan_escrow` they could also choose the token and the Passport and Score contracts it trusts.
2. `loan_escrow` read the risk band from the Passport without checking that the Passport was active or that its KYB was accepted.
3. A frozen Passport made the final repayment fail, because the reputation report to `credit_score` aborted the whole call. A business could not finish paying.
4. An opportunity that was fully funded but not yet released had no exit if the business stopped being eligible. Investor funds would be trapped.
5. Credentials had no expiry on-chain, and a revoked kind could never be re-attached.
6. There was no way to hand over admin, and nothing kept the admin from also holding an operational role.
7. The tests used `mock_all_auths` throughout, so a missing authorization check could not fail a test.

## Decision

**Initialization.** Each contract takes its roles in `__constructor`, which runs in the same transaction as the deployment, so there is no window to front-run. `business_passport(admin, issuer)`, `credit_score(admin, passport)`, `loan_escrow(admin, passport, score, token, keeper)`. The wiring roles that create a cycle (the Passport's reputation manager and the Score's reporter) start **unset** and are set by the admin after all three exist. While unset, nobody can apply reputation or report a loan outcome.

**Role separation.** The admin may never also be the issuer (Passport) or the keeper (Escrow): the constructor rejects it, and so do `set_issuer`, `set_keeper` and `accept_admin`. Admin handover is two-step, `propose_admin` then `accept_admin` by the proposed address, so a typo cannot lock a contract. Every role change emits `role_changed`.

**New value needs an eligible business.** `create`, `fund` and `release` require the business's Passport to be `Active` with KYB `Accepted`, read from the Passport, never from the caller.

**Obligations are never blocked.** `repay` and `default` report to `credit_score` with a fallible call. If the report fails (for example, the Passport is frozen), the money still moves and a `reputation_not_reported` event records it for review.

**Funds are never trapped.** `cancel` (the business, before release) and `force_cancel` (the keeper, only when the business is no longer eligible) refund every investor their exact contribution and return the collateral. The admin can `set_paused`, which stops new opportunities, funding and releases but never repayments, defaults or cancellations.

**Credentials.** `Credential` gains `expires_at`, which must be in the future. A revoked or expired kind can be attached again; an active one cannot be overwritten. `is_credential_valid(business, kind)` is what a verifier calls: active credential, unexpired, on an active Passport. This closes the two gaps named in ADR-0011.

**Testnet asset.** The deploy script issues its own test asset (`FTUSD`, issued by the admin account) and escrows its Stellar Asset Contract, instead of depending on a third-party Testnet USDC whose issuer changes. Nothing on Testnet is real money.

**Tests.** Negative tests now use exact `mock_auths` for every role check that matters: a stranger cannot propose or accept admin, set the issuer, pause, force-cancel, cancel, or default. Contract tests went from 53 to 72.

## Consequences

- The deployment is a fixed sequence: deploy three contracts with constructors, then two admin calls to wire them. `scripts/deploy_testnet.sh` runs it and `scripts/verify_testnet.sh` checks every role, every wiring address and the Wasm hash on-chain.
- `loan_escrow` is about 52 KB of Wasm, still well under the network limit.
- The SDK in `packages/sdk` predates this ABI and also calls escrow functions the contract never had (`list_opportunities`, `get_positions`). The app falls back to its database when those reads fail, so configuring the contract ids is safe, but chain reads need an indexer and an SDK update before they are useful. Tracked in the backlog.
- A reputation update skipped by `reputation_not_reported` must be reconciled by hand or by the future indexer.
- Not done here: an independent security review, which remains a release gate before any real value moves.
