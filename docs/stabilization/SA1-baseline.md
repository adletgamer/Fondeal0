# SA1 — Engineering baseline, protected functionality, defect register

**Track A, Phase SA1 (Stabilization).** Labelled `SA*` because `docs/backlog.md`
already uses A1–A9 for Epic A; SA1 closes backlog **A8** and opened **A9**.

**Baseline commit:** `b7a8f49` (`main`, PR #7) · **Date:** 2026-10-10

**Follow-up:** A9 was resolved in the SA1 integration PR. The baseline findings
and verification results below describe the state before that fix. The three
contracts now build as Wasm and CI requires their artifacts.

SA1 changed no application behavior. It repaired CI, added a regression net, and
recorded what the analysis found. Every defect below is **pre-existing** and
left unfixed on purpose.

---

## 1. Why this phase existed

`docs/dev-plan-2026-Q4.md` puts the toolchain upgrade (soroban-sdk 27→28, JS SDK
16.2→17.2, Protocol 29) and the Testnet deploy next. Neither was safe to start,
because:

> **CI had failed on every recorded run since at least 2026-08-27, and
> `pnpm run test` had never executed in CI, not once.**

The Node job died at `format:check`, step 5 of 9, so `lint`, `typecheck`, `test`
and `build` were skipped on every commit ever pushed. Nothing could have
distinguished "the upgrade broke it" from "it was already broken".

---

## 2. CI: root causes and what changed

### Failure 1 — contracts, wasm target (backlog A8, fixed)

```
error: failed to run custom build command for `soroban-sdk v27.0.6`
Rust compiler 1.82+ with target 'wasm32-unknown-unknown' is unsupported by the
Soroban Environment, use 'wasm32v1-none' available with Rust 1.84+.
```

A real configuration defect, surfaced by toolchain drift: CI tracked `stable`,
and stable moved past 1.82. Retargeted to `wasm32v1-none` in `ci.yml`, the root
`contracts:build` script, `scripts/deploy_testnet.sh` and both READMEs, and the
toolchain is now pinned in `rust-toolchain.toml` so it cannot drift again.

### Failure 2 — contracts, duplicate symbols (backlog A9, deferred)

Fixing failure 1 revealed the next error in the same step:

```
rust-lld: error: duplicate symbol: admin
rust-lld: error: duplicate symbol: init
```

`credit_score` and `loan_escrow` depend on `business-passport` as a Rust crate
to reach `BusinessPassportContractClient` and `RiskBand`. Every contract crate
emits `#[no_mangle]` exports (`init`, `admin`, …), so linking a dependent
contract pulls the sibling's exports in and they collide. **Only
`business_passport.wasm` builds.**

This is target-independent and equally pre-existing; it was simply never reached
before. The correct fix is the standard Soroban multi-contract layout (shared
types in a non-contract crate plus `#[contractclient]` traits). That changes the
exported surface of each contract and carries XDR-encoding risk with no
deployment to validate against, so it is **A9**, with its own phase, and it
**blocks E8 (Testnet deploy)**. Until then the wasm step is
`continue-on-error: true` with that reasoning inline in `ci.yml`. `fmt`,
`clippy -D warnings` and all 50 contract tests remain hard-enforced.

### Failure 3 — Node, prettier (backlog A8, fixed)

Three files genuinely violated `.prettierrc.json`:
`apps/web/src/app/invest/positions/page.tsx`,
`apps/web/src/components/risk-disclosure.tsx`,
`apps/web/src/components/score-breakdown.tsx`. All three were line-wrapping only
(`printWidth: 100`); the diff contains no token changes.

### Real failure vs environment artifact

Asked and answered with measurements, because the two look identical in a log:

- The 3 prettier failures were **real content deviations**. Every file in a
  Windows working tree is CRLF (`core.autocrlf=true`, no `.gitattributes`),
  including files CI calls clean, so line endings could not be the
  differentiator.
- There *was* a separate, purely environmental hazard: locally
  `pnpm run format:check` flagged **110 files**, against **3** in Linux CI. That
  noise is exactly why three genuinely broken files survived for months.
  `.gitattributes` (`* text=auto eol=lf`) makes the local signal match CI.
- No test anywhere was failing. `cargo test` was green; `pnpm test` had never run.

---

## 3. Protected Functionality Matrix

Behavior that must keep working identically. "Guard" is what enforces it today.

| # | Functionality | Implementation | Guard | Tests after SA1 |
|---|---|---|---|---|
| 1 | Privy auth + session | `lib/auth/session.ts` `getSession` (React `cache`), `lib/actions/session.ts` `syncSession` | `verifyAuthToken`; httpOnly `fondealo_session`; **fails closed** | none (SA2) |
| 2 | Stellar wallet creation | `hooks/use-stellar-wallet.ts`; persisted by `resolveWallet` | 3 retries; Friendbot fire-and-forget, XLM only | none (SA2) |
| 3 | Onboarding + role | `lib/actions/onboarding.ts` `chooseRole` | write-once via `updateMany({where:{role:null}})` | none (SA2) |
| 4 | KYB sandbox | `lib/actions/kyb.ts` `submitKyb` | zod + tax-ID regex; taxId ending `0000` → Rejected; single `$transaction` | none (SA2) |
| 5 | Business Passport | `lib/data/opportunities.ts` `getBorrowerPassport` (chain → DB → demo) | written only by `submitKyb`; score 500 at KYB | Rust 24 |
| 6 | Ledger + balances | `lib/wallet/ledger.ts` | BigInt stroops; Serializable, 3 attempts on P2034; `InsufficientFundsError` | **18 new** |
| 7 | Opportunity creation | `lib/actions/opportunities.ts` `createOpportunity` | `requireRole('Business')`; band from passport, not the form | formula 16 + **44 parity** |
| 8 | Partial + full funding | `fundOpportunity` | `requireRole('Investor')`; `Open` only; self-funding blocked | Rust 17 |
| 9 | Repayments | `repayOpportunity` | `requireRole('Business')` + the only resource-ownership check | Rust (on-chain path) |
| 10 | Collateral | `packages/types/src/collateral.ts` ↔ `loan_escrow/src/types.rs` | two hand-synced tables | **44 parity** |
| 11 | Authorization | `middleware.ts` (cookie presence only), layouts, `requireRole` | real check is layout + action | none (SA2) |

---

## 4. Test coverage: before and after

| Area | Before | After | Note |
|---|---|---|---|
| `packages/types` | 29 | **73** | +44 TS↔Rust parity |
| `apps/web` | 0 (placeholder script) | **18** | ledger invariants; vitest added |
| Soroban contracts | 50 | 50 | all passing, pinned toolchain |
| **Total** | **79** | **141** | |
| Executed in CI | **0** | 141 | the Node job had never reached `test` |

### Structural blind spots that remain (SA2)

1. **All 50 Rust tests use `mock_all_auths()`.** Not one proves a wrong caller
   is *rejected*; every `require_auth` is effectively untested. Planned for SA1
   and deferred when A9 consumed the contract budget.
2. **Server actions are untested.** `createOpportunity`, `fundOpportunity`,
   `repayOpportunity` and the role gates have no coverage. The vitest harness
   and `src/test/prisma-mock.ts` now exist to make this cheap.
3. **No real-database tests.** Serializable retry, unique constraints and
   rollback are only reasoned about, not exercised.
4. **No coverage tooling or thresholds anywhere.**

---

## 5. Defect register

All pre-existing. None fixed in SA1.

| ID | Sev | Defect | Evidence | Target |
|---|---|---|---|---|
| SA1-01 | **P0 latent** | On-chain fund passes whole USDC where the contract expects stroops, so 500 USDC would fund 0.00005 USDC. Dormant only because no contract id is configured and a bare `catch` swallows the failure. **Detonates on Testnet deploy.** | `apps/web/src/components/fund-panel.tsx:54` | Before dev-plan Phase 1 |
| SA1-02 | **P0** | After an on-chain fund attempt the DB action always runs too, so a successful on-chain fund is double-recorded. `Funding.txHash` is never populated. | `fund-panel.tsx:84-86` | Same phase as SA1-01 |
| SA1-03 | **P0** | Contracts wasm build cannot link (backlog A9). Blocks the Testnet deploy. | `cargo build --target wasm32v1-none` | A9 |
| SA1-04 | P1 | Off-chain `totalDue` is float and unfloored; the contract floors the interest. The two disagree on the amount owed. | `lib/actions/opportunities.ts:290-292` vs `loan_escrow/src/lib.rs:414-417` | SA2 |
| SA1-05 | P1 | `Repayment.onTime` is hard-coded `true`. Repayment never updates the Passport, never writes `ScoreEvent`. The reputation loop, the product's differentiator, exists only on-chain. | `opportunities.ts:315` | SA2 |
| SA1-06 | P1 | `depositTestFunds` has no role check, no cap and no rate limit; 25,000 USDC per call, unbounded calls. | `lib/actions/wallet.ts` | SA2 |
| SA1-07 | P1 | `isFinal` is decided with a ±0.01 USDC epsilon, so a loan can close up to a cent short. Characterized, not changed. | `opportunities.ts:301-306` | SA2 |
| SA1-08 | P2 | Schema comments say `Opportunity/Funding/Repayment.amount` are stroops; the code stores whole USDC, in `String` columns. | `schema.prisma:138` vs `opportunities.ts:110` | SA2 |
| SA1-09 | P2 | `usdcToStroops` multiplies through a double: above ~900M USDC, one stroop of input moves the result by two. Outside the 1,000,000 USDC product cap. Characterized. | `lib/wallet/ledger.ts:14` | When the cap rises |
| SA1-10 | P2 | `middleware.ts` only checks cookie *presence*; `invest/opportunity/[id]` is reachable with any cookie value and exposes the borrower address. | `middleware.ts` | SA2 |
| SA1-11 | P2 | SDK calls `list_opportunities` and `get_positions`, which do not exist in the contract; `normalizeOpportunity` reads a non-existent `opportunity_id`. | `packages/sdk/src/escrow-client.ts` | With A9 |

---

## 6. Verification run (2026-10-10, pinned toolchain)

| Check | Result |
|---|---|
| `pnpm run format:check` | pass (Linux/LF; see §2 for the Windows caveat) |
| `pnpm run lint` | **pass**, 9/9 tasks |
| `pnpm run typecheck` | **pass**, 9/9 tasks |
| `pnpm run test` | **pass**, 9/9 tasks, 91 TS tests |
| `pnpm run build` | **pass**, 5/5 tasks |
| `cargo fmt --all --check` | pass |
| `cargo clippy --all-targets -- -D warnings` | pass |
| `cargo test` | **pass**, 50 tests (24 + 9 + 17) |
| `cargo build --target wasm32v1-none --release` | **fails at link** — A9, not enforced |

`lint`, `typecheck` and `build` were run for the first time in this repository's
CI history during SA1. All three were already clean; the only failures found
were the three prettier files and the two contract-build defects.

---

## 7. What SA2 should take

1. **A9 first** — it blocks the deploy and everything downstream of it.
2. Negative-auth tests for all three contracts (replace `mock_all_auths()`).
3. Server-action tests on the harness SA1 left behind (`src/test/prisma-mock.ts`).
4. Then SA1-01 and SA1-02, before any Testnet deploy.
