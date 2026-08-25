# ADR-0002: Monorepo with pnpm + Turborepo and strict tooling from day one

- **Status:** Accepted
- **Date:** 2026-08-25

## Context
The product spans a Next.js app, shared UI, a TS SDK, a Postgres layer, shared types, and a Rust/Soroban workspace. These share types and must ship together. We also need code-quality gates that signal engineering maturity to SCF reviewers.

## Decision
Single monorepo (`apps/*`, `packages/*`) managed with **pnpm workspaces + Turborepo**. Enforce from the first commit: **ESLint, Prettier, Husky, Commitlint (Conventional Commits), GitHub Actions** (lint, typecheck, test, `cargo build/test`, `stellar contract build`). Rust contracts live in `packages/soroban` as a Cargo workspace.

## Consequences
- (+) Shared `types`/`sdk` consumed by web without publishing; atomic cross-cutting changes.
- (+) CI + conventional commits produce a clean, auditable history (good for grant reviewers and changelogs).
- (−) Slightly more initial setup; contributors must learn the workspace tooling.

## Alternatives considered
- Polyrepo (separate repos for web/contracts/sdk) — rejected: version drift, painful cross-changes for a small team.
- Nx instead of Turborepo — viable; Turborepo chosen for simpler config and Vercel/Next affinity.
- npm/yarn workspaces — rejected in favor of pnpm (speed, strict node_modules).
