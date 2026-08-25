# ADR-0004: Business Passport — hybrid storage and identity key

- **Status:** Accepted (identity key = Stellar account for MVP; revisit for portability)
- **Date:** 2026-08-25

## Context
The Business Passport must be "verifiable from Soroban" yet hold KYB data that is PII and cannot legally/practically live on-chain. Soroban offers Persistent (durable, archivable), Instance (small config), and Temporary (cheap, deleted on expiry) storage. We also must choose the **identity key** for a business.

## Decision
**Hybrid model.** On-chain **Persistent** storage holds only trust-bearing facts: `kyb_status`, `score`, `risk_band`, loan counters, `issued_at`, `updated_at`, and a `data_hash` (commitment to the off-chain KYB bundle). PII/documents live **off-chain in Postgres**, provable against `data_hash`. Contract **Instance** storage holds admin/config (USDC SAC address, authorized writers). **Temporary** storage is used only for ephemera (oracle reads/sessions), never reputation.

**Identity key:** the business's **Stellar account address** for MVP (simple, Sybil-costly when KYB-gated). A Fondealo-issued business ID (decoupling reputation from a single keypair, aiding key rotation/portability) is deferred and tracked as an open question.

## Consequences
- (+) Cheap, legally sane, still on-chain-verifiable; any contract can read the Passport.
- (+) Clear separation: chain = trust facts, Postgres = data.
- (−) Off-chain PII requires its own security/compliance posture.
- (−) Account-as-identity complicates key loss/rotation; may force a migration to Fondealo IDs later.

## Consequence for TTL (critical)
Persistent entries archive on TTL expiry. We ship a **TTL subsystem**: contract `bump_ttl`, a `scripts/` bumper for demos, and a documented **restore** path so a business returning after long inactivity does not lose its Passport. Reputation "surviving between loans" depends on this being real, not assumed.

## Alternatives considered
- Everything on-chain (incl. KYB data) — rejected: PII exposure, cost, data-law violation.
- Everything off-chain with a signature — rejected: not "verifiable from Soroban", loses the composable primitive that is our differentiator.
