# Fondealo

**Credit infrastructure for Latin American SMEs, built natively on Stellar.**
*Infraestructura de crédito para PyMEs latinoamericanas, construida de forma nativa sobre Stellar.*

> Stellar · Soroban · USDC · on-chain reputation

---

## What Fondealo is / Qué es Fondealo

**EN —** Fondealo is not a lending protocol and not a migration of anything. It is the missing **credit-identity layer** for Stellar DeFi: a reusable **Business Passport** (KYB status, credit score, risk band, payment history — verifiable from Soroban) and a portable **Credit Reputation Score** that grows with every successful repayment and survives across loans. We compose on existing Stellar money-legos — **Blend** (lending), **Reflector** (pricing), **DeFindex** (yield), **USDC** (settlement) — and own the layer they lack: *who is this business, can they repay, and does good behavior compound?*

**ES —** Fondealo no es un protocolo de préstamos ni una migración. Es la **capa de identidad crediticia** que le falta al DeFi de Stellar: un **Business Passport** reutilizable (estado KYB, score, riesgo, historial — verificable desde Soroban) y un **Credit Reputation Score** portable que crece con cada repago exitoso y sobrevive entre préstamos. Componemos sobre Blend, Reflector, DeFindex y USDC, y construimos la capa que ellos no tienen.

## Core loop / Flujo principal
`register → KYB → Business Passport → create opportunity → fund in USDC → repay → score up`

## Two differentiators / Dos diferenciadores
1. **Business Passport** — a reusable, on-chain, verifiable business identity.
2. **Credit Reputation Score** — portable reputation that compounds across loans.

## Tech / Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind, shadcn/ui
- **Backend:** Next.js Server Actions, PostgreSQL
- **Blockchain:** Stellar Testnet, Soroban (Rust), USDC via Stellar Asset Contract
- **Auth:** SEP-10 wallet auth via Stellar Wallets Kit (Freighter default)
- **Compose:** Blend (lending), Reflector (oracle), DeFindex (yield)
- **Baseline:** Protocol 27 · soroban-sdk 27.x · JS SDK 16.2.0 · Stellar CLI 27.1.0

## Status
**Phase 1 (Research) & Phase 2 (Architecture) — this PR.** No product code yet, by design: decisions are gated and reviewed before scaffolding.

## Docs
- [`docs/research.md`](docs/research.md) — findings, opportunities, risks, recommended architecture
- [`docs/architecture.md`](docs/architecture.md) — proposed system design
- [`docs/adr/`](docs/adr/) — architecture decision records
- [`docs/roadmap.md`](docs/roadmap.md) — phased plan + SCF tranche mapping
- [`docs/risks.md`](docs/risks.md) — risk register
- [`docs/backlog.md`](docs/backlog.md) — prioritized backlog

## Target programs
Stellar Community Fund · InstaAwards · Soroban Ecosystem · Stellar acceleration.

## License
See [`LICENSE`](LICENSE).
