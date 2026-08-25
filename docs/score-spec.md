# Fondealo — Credit Reputation Score Spec (v1)

**Status:** Implemented in `packages/soroban/contracts/credit_score` · **Owner:** CTO
**Related:** ADR-0005 (on-chain reputation), ADR-0008 (score engine design), Risk R-01 (gaming).

The score is the second differentiator: a **portable, deterministic, on-chain**
reputation that compounds across loans. This spec is the single source of truth
for the formula; the contract implements exactly this and `preview()` returns the
same result off a hypothetical input.

## Domain

- **Score:** integer `0..=1000`. Higher is better.
- **Risk band** (derived by the Passport): A `800–1000`, B `650–799`, C `500–649`,
  D `350–499`, E `0–349`.
- The **Business Passport is the store of record.** The score engine computes and
  writes back via `apply_reputation`; it holds no per-business score itself.

## Inputs per event

| Input | Meaning |
|---|---|
| `current` | the business's current score (read from Passport) |
| `on_time` | was the repayment on schedule? |
| `external` | was the loan funded by third-party investors (not the business itself)? |
| `streak` | current consecutive on-time-external repayment streak (from Passport) |

## Parameters (v1, fixed)

| Param | Value | Role |
|---|---|---|
| `BASE_GAIN` | 40 | base reward for an on-time external repayment |
| `STREAK_BONUS_PER` | 5 | added per prior streak step |
| `STREAK_BONUS_MAX` | 50 | cap on streak bonus |
| `LATE_PENALTY` | 30 | subtracted for a late (but external) repayment |
| `DEFAULT_PENALTY` | 150 | subtracted on default |

## Formula

```
next_score(current, on_time, external, streak):
    if not external:                      # ← anti-gaming (R-01)
        return current                    #   self-funded round trips are score-NEUTRAL
    if on_time:
        headroom     = 1000 - current
        streak_bonus = min(streak * 5, 50)
        gain         = (40 + streak_bonus) * headroom / 1000   # integer division
        return min(current + gain, 1000)
    else:
        return max(current - 30, 0)

on_default(current):
    return max(current - 150, 0)          # streak resets to 0, loan counts as taken not repaid
```

### Why these shapes

- **External-only rewards (R-01).** The most obvious attack on a reputation that
  lowers borrowing cost is to fund your own loan and "repay" it to farm score.
  Making `external == false` strictly score-neutral removes the incentive: a
  round-trip costs gas and moves nothing. Real reputation requires *someone else's*
  capital to have been at risk.
- **Diminishing returns.** `gain ∝ headroom` means early good behavior is rewarded
  strongly and the score asymptotically approaches — but never trivially reaches —
  the cap. Concretely: at 100 an on-time external repayment gains 36; at 950 it
  gains 2.
- **Streak bonus.** Rewards *sustained* good behavior, capped so it can't dominate.
- **Asymmetric penalties.** Default (150) >> late (30) >> self-funded (0), matching
  real credit risk. Penalties are flat (not headroom-scaled) so they bite hardest
  where it matters — high scorers who default fall meaningfully.

## Portability & persistence

The score lives in the Passport (persistent storage, TTL-kept-alive), so it
**survives between loans** and is readable by any Stellar contract — the basis for
"a clean record on loan #1 lowers the cost of loan #4, anywhere in the network."

## Anti-gaming checklist (tracked against R-01)

- [x] Self-funded round trips are score-neutral (`external` flag).
- [x] Score is bounded `0..=1000`; no overflow (`saturating_*`, `min`).
- [ ] `external` must be **proven**, not asserted — in the funding flow (Phase 6)
      `external` is derived on-chain from escrow facts (distinct funder ≠ business),
      not passed as a trusted boolean by the caller. **Open — Phase 6.**
- [ ] Sybil businesses: mitigated by KYB-gated issuance (only `Accepted` KYB gets a
      Passport). Depends on real KYB (Phase 4 backend). **Open.**
- [ ] Collusion (investor and business are different entities but coordinated):
      off-chain monitoring of funder↔business graphs (Risk register monitoring plan).

## Versioning

Parameters are fixed constants; a change to the model ships as a **new contract
version** with an explicit migration, never a silent tweak. Governance over
parameters is a post-MVP decision (progressive decentralization).
