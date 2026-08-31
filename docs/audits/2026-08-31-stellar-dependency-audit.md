# Priority 3 — Stellar Dependency Audit

**Date:** 2026-08-31
**Rule:** upgrade to **stable** releases only; stay aligned with the protocol the **mainnet** is actually running.

## Protocol baseline

| | Version | Source |
| --- | --- | --- |
| Stellar **mainnet** today | **Protocol 27** ("Zipper", activated Jul 2026) | stellar.org upgrade guides |
| Next | Protocol 28 — testnet vote 2026-08-27, **mainnet vote 2026-09-16** | stellar.org |
| Fondealo contracts (`stellar-xdr`) | 27.0.0 | `packages/soroban/Cargo.lock` |

**Conclusion: the repo is correctly pinned to Protocol 27.** The temptation right now is to
jump to the 17.x / 28.x lines that appear as "latest" on npm/crates — those are the
**Protocol 28 track** and would put the client ahead of the network it talks to (XDR decode
mismatches against a P27 Horizon/RPC). Hold until P28 activates on mainnet.

## Table

| Package | Current | Latest stable | Upgrade needed | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `@stellar/stellar-sdk` (npm, `packages/sdk`) | `^16.2.0` → 16.2.0 | **17.0.1** (latest) · **16.3.0** (`lts-16`, P27 line) | **Yes → 16.3.0 only** | 🟢 Low for 16.3.0 (same major, P27). 🔴 High for 17.x (Protocol 28 track — ahead of mainnet). | Bump to `^16.3.0`. Revisit 17.x the week P28 activates on mainnet. |
| `@creit.tech/stellar-wallets-kit` (npm, `packages/sdk`) | `^2.5.0` → 2.5.0 | **2.6.0** | Optional | 🟢 Low — minor, still the v2 static API (`StellarWalletsKit.init`, `authModal`) the wrapper is built on. | Bump to `^2.6.0`, smoke-test the connect modal. Not urgent for the demo. |
| `soroban-sdk` (crates, `packages/soroban`) | `"27"` → **27.0.6** | **27.0.6** stable (28.0.0-rc.1 is pre-release) | **No** | 🟢 Already current and P27-aligned. | Keep `27`. Do **not** move to `28.0.0-rc.1` (release candidate, and P28). |
| `stellar-xdr` (transitive, contracts) | 27.0.0 | tracks `soroban-sdk` | No | 🟢 | Keep. |
| Stellar CLI (`stellar` / `soroban`, deploy scripts only) | not pinned — `packages/soroban/README.md` + `scripts/deploy_testnet.sh` assume a local install | `stellar-cli` **28.0.0** · `soroban-cli` 27.0.0 | Pin it | 🟡 Medium — an unpinned CLI on a contributor's machine can be a P28 build that emits contract metadata a P27 network rejects. | Add `stellar-cli = "27"` guidance to the soroban README / a `.tool-versions`; CLI 27.x matches `soroban-sdk` 27. |
| Rust toolchain | 1.93.1 (local, from `target/.rustc_info.json`) | n/a | No | 🟢 Builds `soroban-sdk` 27 fine. | Add a `rust-toolchain.toml` pinning e.g. `1.90`+ so CI and contributors match. |
| `@stellar/stellar-base` (transitive) | 14.1.0 / 14.2.0 (via sdk 16.2.0) | moves with the SDK | No | 🟢 | Resolves automatically when the SDK bumps. |

## Actions for this MVP (safe, stable, P27-aligned)

| Done | Action |
| --- | --- |
| ✅ | `packages/sdk`: `@stellar/stellar-sdk` `^16.2.0 → ^16.3.0` (resolves to 16.3.0, the `lts-16` / P27 line). `pnpm --filter @fondealo/sdk typecheck` + `@fondealo/web build` green. |
| ✅ | `packages/sdk`: `@creit.tech/stellar-wallets-kit` `^2.5.0 → ^2.6.0` (2.6.0). Still the v2 static API — no wrapper change. Manual connect-modal smoke test still pending on a real browser. |
| ✅ | Verified `soroban-sdk` is already `27.0.6` (crates `max_stable`) — **no change**. |
| ⬜ | `packages/soroban`: add `rust-toolchain.toml` + note `stellar-cli` 27.x in the README (deferred — deploy tooling only, not runtime). |
| — | **Not touched:** nothing moved to the 17.x / 28.x lines. Those are Protocol 28 and would run ahead of mainnet. |

> **Note on the local pnpm cache:** `pnpm install --prefer-offline` reported a stale
> "latest is 15.0.1" for `@stellar/stellar-sdk` and failed to find 16.3.0. A plain
> `pnpm install` (fresh registry metadata) resolved it correctly. If CI uses
> `--prefer-offline` / `--frozen-lockfile`, make sure the lockfile is committed (it is).

## Post-P28 checklist (do not do now — ~2026-09-16)

- `@stellar/stellar-sdk` → `^17.x`, re-verify all XDR encode/decode in `packages/sdk`.
- `soroban-sdk` → `28.x` once it leaves rc; rebuild + re-run `cargo test` (currently 11/11) + `clippy -D warnings`.
- `stellar-cli` → `28.x`; redeploy all three contracts to Testnet, refresh the contract ids in `.env`.
- Bump `docs/adr/0007` with the new pins and supersede this audit.

Sources: [npm @stellar/stellar-sdk](https://www.npmjs.com/package/@stellar/stellar-sdk) · [crates.io soroban-sdk](https://crates.io/crates/soroban-sdk) · [crates.io stellar-cli](https://crates.io/crates/stellar-cli) · [npm stellar-wallets-kit](https://www.npmjs.com/package/@creit.tech/stellar-wallets-kit) · [Stellar Protocol 28 upgrade guide](https://stellar.org/blog/developers/adapter-protocol-28-upgrade-guide) · [Stellar software versions](https://developers.stellar.org/docs/networks/software-versions)
