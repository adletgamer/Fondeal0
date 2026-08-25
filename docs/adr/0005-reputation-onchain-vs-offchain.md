# ADR-0005: Credit reputation score lives on-chain and is deterministic

- **Status:** Accepted
- **Date:** 2026-08-25

## Context
The portable Credit Reputation Score is Fondealo's second differentiator: each successful repayment should raise score, lower risk, and **persist across loans**, portable to any consumer. We must decide whether the score is computed on-chain (transparent, composable, gameable-in-the-open) or off-chain (flexible, private, but not a trust primitive).

## Decision
The **canonical score and its transition rules live on-chain** in the `credit_score` contract as a **deterministic, open-source** function of loan-lifecycle events. Off-chain analytics may *inform* future model proposals, but the authoritative number a lender consumes is on-chain. Score transitions reward **net external, on-time repayment**, apply **diminishing returns + decay**, and penalize default — with explicit anti-gaming rules (round-trip self-funding is score-neutral; see Risks R-01). Exact weights are fixed in a dedicated **score spec** before Phase 5 implementation.

## Consequences
- (+) The score becomes a *composable, verifiable* primitive other protocols can trust — the whole point.
- (+) Transparency builds borrower/investor trust and satisfies "meaningful Stellar integration."
- (−) On-chain logic is public and thus probed for gaming; requires careful economic design.
- (−) Harder to iterate than an off-chain model; mitigated by versioned score contracts + governance for parameter changes.

## Alternatives considered
- Off-chain ML score, only hash on-chain — rejected for v1: not a trust primitive, opaque, no composability, harder to justify to SCF as core Stellar value.
- Fully off-chain — rejected: reduces Fondealo to a normal fintech, no on-chain differentiation.
