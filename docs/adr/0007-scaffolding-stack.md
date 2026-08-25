# ADR-0007: Phase 3 scaffolding stack and version pins

- **Status:** Accepted
- **Date:** 2026-08-25
- **Supersedes / refines:** ADR-0002 (monorepo & tooling)

## Context
Phase 3 turns the architecture into a running skeleton. We must pin concrete,
current, maintained versions (the "no fictional deps" rule) and verify they
actually build, so a reviewer cloning the repo gets green CI.

## Decision
Pin to the following, all verified installed/compiled in this phase:

| Area | Choice | Version | Why |
|---|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | pnpm 10.28, turbo 2.x | fast, strict, Vercel/Next affinity |
| Language | TypeScript | 5.7 | strict config, `noUncheckedIndexedAccess` on |
| Lint/format | ESLint 9 flat config + Prettier | eslint 9, typescript-eslint 8 | modern flat config shared at root |
| Commits | Commitlint + Husky + lint-staged | conventional commits | auditable history for reviewers |
| Contracts | Rust + `soroban-sdk` | **27** (27.0.6) | matches mainnet Protocol 27 baseline |
| Web | Next.js (App Router) + React | Next 15.1, React 19 | satisfies "Next 15+"; RSC + Server Actions |
| Styling | Tailwind CSS + tiny shadcn-style UI | Tailwind 3.4 | mature, low-risk config |
| JS Stellar | `@stellar/stellar-sdk` | **16.2.0** | the SDK version listed for mainnet Protocol 27 |
| Wallets | `@creit.tech/stellar-wallets-kit` | **2.5.0** (static API) | maintained multi-wallet + passkey kit |
| DB | PostgreSQL + Prisma | Prisma 6 | typed schema for the off-chain index/PII |

### Notable version realities discovered (not assumed)
- `soroban-sdk` latest on crates.io is **27.0.6**; the deprecated `Events::publish`
  is replaced by the `#[contractevent]` macro (used here) so `clippy -D warnings`
  stays green.
- `@stellar/stellar-sdk` npm `latest` is 17.0.0 (Protocol 28 track); we pin
  **^16.2.0** to match our Protocol 27 baseline.
- Stellar Wallets Kit **v2** is a **static** API (`StellarWalletsKit.init(...)`,
  `authModal()`), not the older instance/`allowAllModules` API. The SDK wrapper
  reflects v2.

## Consequences
- (+) `cargo test` (11/11), `cargo clippy -D warnings`, `cargo fmt`, and TS
  typecheck/lint/prettier all pass in this phase; CI mirrors them.
- (+) Reviewer can clone → `pnpm install` → build with no surprises.
- (−) Next.js `next lint` is deprecated for Next 16; migrate to the ESLint CLI
  when we move to Next 16 (tracked as tech-debt).
- (−) Prisma client generation needs network to `binaries.prisma.sh`; it runs in
  CI and locally, but not inside restricted/offline sandboxes.

## Alternatives considered
- Tailwind 4 / Next 16 / stellar-sdk 17 (all newer) — deferred to reduce breakage
  risk during the hackathon; revisit post-MVP.
- Drizzle instead of Prisma — viable; Prisma chosen for schema ergonomics and
  Studio. Reconsider if the no-engine/driver-adapter path matters for edge runtime.
