# ADR-0003: Integrate Blend as the lending engine instead of building our own

- **Status:** Accepted (MVP nuance below)
- **Date:** 2026-08-25

## Context
Fondealo needs a money market: pooled capital, lending, interest, defaults. Building an audited money market is months of work and a large attack surface. **Blend** is a live-on-mainnet, audited, permissionless lending primitive with isolated pools and a backstop insurance module; anyone can deploy a pool. SCF's Build Award explicitly *prefers leveraging existing ecosystem solutions*, and Stellar's design ethos is composability.

## Decision
Do **not** build a general money market. Fondealo owns the **credit-identity + underwriting + reputation** layer and **composes** on Blend for lending, **Reflector** for pricing, and **DeFindex** for idle-liquidity yield.

**MVP nuance:** to keep full control of the demo loop and the on-chain metrics for the first tranche, MVP ships a **thin `loan_escrow` contract** (fund → release → repay → score). Money-movement migrates to a **Fondealo-curated Blend pool** in Phase 6+, while the Passport/score primitives remain unchanged.

## Consequences
- (+) Massively smaller scope and attack surface; faster to mainnet; aligns with SCF composability preference.
- (+) Distribution upside: other Stellar lenders can consume Fondealo reputation.
- (−) Dependency on Blend's roadmap, risk parameters, and pool mechanics.
- (−) Two-step path (escrow → Blend) is extra migration work; mitigated by keeping Passport/score independent of the money layer.

## Alternatives considered
- Build a bespoke money market — rejected: scope, audit cost, reinvents a funded primitive.
- Go straight to Blend in MVP — deferred: less demo control and harder to produce a clean, isolated first-tranche metric; revisit if Blend pool creation proves trivial.
