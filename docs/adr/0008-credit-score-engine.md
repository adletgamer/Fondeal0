# ADR-0008: Credit score engine — separate contract, cross-contract writes to the Passport

- **Status:** Accepted
- **Date:** 2026-08-25
- **Related:** ADR-0005 (on-chain reputation), ADR-0004 (Passport storage), `docs/score-spec.md`, Risk R-01

## Context
Phase 5 implements the reputation engine. Two structural questions: (1) where does
the score logic live, and (2) how does it update the Passport without letting the
engine also mint identities or letting anyone forge score updates?

## Decision
1. **Separate `credit_score` contract**, distinct from `business_passport`. The
   Passport remains the **store of record**; the engine holds no per-business score,
   it reads the Passport, computes `next_score` deterministically (see score-spec),
   and writes back via a **cross-contract call** to `apply_reputation`.
2. **Two write roles on the Passport** (refines ADR-0004): `issuer` (KYB/issue) and
   `reputation_manager` (reputation). The deployed `credit_score` contract is set as
   the Passport's `reputation_manager`. Soroban satisfies `reputation_manager.require_auth()`
   automatically because the score contract is the direct caller — the same mechanism
   a contract uses to move its own token balance. No shared admin key can forge scores.
3. **`credit_score` is reporter-gated.** `on_repayment` / `on_default` require the
   `reporter` (the escrow contract in Phase 6, an admin backend key for now), so only
   real loan outcomes drive the score.
4. **`external` flag carries the anti-gaming rule (R-01).** Self-funded round trips
   are score-neutral. For MVP the reporter passes `external`; in Phase 6 it must be
   **derived on-chain** from escrow facts (funder ≠ business), not trusted. Tracked
   as an open item in score-spec and R-01.

## Consequences
- (+) Clean separation of concerns; the score is a transparent, versioned, auditable
  primitive; identity minting and reputation are independently authorized.
- (+) Upgrading the score model = deploy a new `credit_score` and point the Passport's
  `reputation_manager` at it (admin rotation), with the Passport data intact.
- (+) 20/20 contract unit tests pass, including the cross-contract path and the
  self-funded-is-neutral anti-gaming test.
- (−) Cross-contract call couples the two contracts at deploy time (wiring order:
  deploy both → `passport.init(admin, issuer, score_id)` → `score.init(admin, passport_id, reporter)`).
- (−) `external` as a trusted boolean is a temporary weakness until Phase 6 derives it
  on-chain; called out explicitly rather than hidden.

## Alternatives considered
- **Score inside the Passport contract** — rejected: couples model changes to the
  identity contract and bloats it; separate versioned engine is cleaner.
- **Engine stores its own score, Passport mirrors** — rejected: two sources of truth,
  drift risk; contradicts "Passport is the store of record."
- **Single Passport writer role** — rejected: the score contract would then also be
  able to issue identities (or the backend could forge scores). Role split is safer.
