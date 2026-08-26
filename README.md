<div align="center">

# Fondealo

**Credit infrastructure for Latin American SMEs, built natively on Stellar.**
_Infraestructura de crédito para PyMEs latinoamericanas, construida de forma nativa sobre Stellar._

`Stellar` · `Soroban` · `USDC` · `on-chain reputation`

**▶ Live MVP: [fondealo.vercel.app](https://fondealo.vercel.app)**

</div>

---

## Deployments

| Environment | Target | Address / URL | Status |
| ----------- | ------ | ------------- | ------ |
| Web (MVP)   | Vercel | https://fondealo.vercel.app | ✅ live |
| `business_passport` | Stellar Testnet (Soroban) | _run `scripts/deploy_testnet.sh` → paste id_ | ⏳ pending |
| `credit_score` | Stellar Testnet (Soroban) | _run `scripts/deploy_testnet.sh` → paste id_ | ⏳ pending |
| `loan_escrow` | Stellar Testnet (Soroban) | _run `scripts/deploy_testnet.sh` → paste id_ | ⏳ pending |

> The web app is live on Vercel. The Soroban contracts deploy separately with
> `scripts/deploy_testnet.sh` on a machine with internet (funds a Testnet key via
> Friendbot, deploys all three contracts, wires roles — including `loan_escrow`
> as `credit_score`'s reporter — writes `apps/web/.env.local`). Requires
> `USDC_SAC_ADDRESS` (the USDC Stellar Asset Contract to escrow) since there is
> no fixed Testnet USDC address to fall back to. Once deployed, paste the `C…`
> contract ids above and set them in the app env.

---

## What Fondealo is · Qué es Fondealo

**EN —** Fondealo is not a lending protocol and not a migration of anything. It is the missing
**credit-identity layer** for Stellar DeFi: a reusable **Business Passport** (KYB status, credit
score, risk band, payment history — verifiable from Soroban) and a portable **Credit Reputation
Score** that grows with every successful repayment and survives across loans. We compose on the
existing Stellar money-legos — **Blend** (lending), **Reflector** (pricing), **DeFindex** (yield),
**USDC** (settlement) — and own the layer they lack: _who is this business, can they repay, and does
good behavior compound?_

**ES —** Fondealo no es un protocolo de préstamos ni una migración. Es la **capa de identidad
crediticia** que le falta al DeFi de Stellar: un **Business Passport** reutilizable (estado KYB,
score, riesgo, historial — verificable desde Soroban) y un **Credit Reputation Score** portable que
crece con cada repago y sobrevive entre préstamos. Componemos sobre Blend, Reflector, DeFindex y
USDC, y construimos la capa que ellos no tienen.

### Core loop · Flujo principal

```
register → KYB → Business Passport → create opportunity → fund in USDC → repay → score up
```

### Two differentiators · Dos diferenciadores

1. **Business Passport** — a reusable, on-chain, verifiable business identity.
2. **Credit Reputation Score** — portable reputation that compounds across loans.

---

## Monorepo

```
fondealo/
├─ apps/
│  └─ web/            Next.js 15 (App Router, Server Actions) · Tailwind · shadcn-style UI
├─ packages/
│  ├─ soroban/        Rust / Soroban contracts (Cargo workspace)
│  │  ├─ contracts/business_passport   ← the trust primitive (implemented + tested)
│  │  ├─ contracts/credit_score        ← reputation engine (implemented + tested)
│  │  └─ contracts/loan_escrow         ← collateral + funding flow (implemented + tested)
│  ├─ sdk/            TS client: network config, Wallets Kit, Passport read client
│  ├─ types/          Shared domain types + zod schemas
│  ├─ database/       Prisma schema for the off-chain index / PII
│  └─ ui/             Shared design-system components
├─ docs/              research · architecture · ADRs · roadmap · risks · backlog
├─ scripts/           deploy + ops (Testnet deploy, TTL bumper)
└─ .github/workflows  CI (Node + Rust)
```

## Tech baseline

Protocol **27** · `soroban-sdk` **27** · `@stellar/stellar-sdk` **16.2.0** · Stellar CLI **27** ·
Next.js **15** · React **19** · TypeScript **5.7** · PostgreSQL + Prisma **6**. Testnet-first.

## Quickstart

```bash
# prerequisites: Node 22, pnpm 10, Rust (stable) + wasm target, and stellar-cli for deploys
pnpm install                    # install JS workspaces
cp .env.example apps/web/.env.local

# --- contracts ---
pnpm contracts:test             # cargo test (native)
pnpm contracts:build            # build wasm (needs wasm32-unknown-unknown target)

# --- web / packages ---
pnpm --filter @fondealo/database db:generate   # generate Prisma client
pnpm dev                        # run the web app
pnpm lint && pnpm typecheck     # what CI runs
```

Deploy the Passport contract to Testnet:

```bash
NETWORK=testnet SOURCE=deployer ./scripts/deploy_testnet.sh
# then set NEXT_PUBLIC_PASSPORT_CONTRACT_ID in apps/web/.env.local
```

## Status · Estado

Phase-gated: each phase ends with ADRs and review before the next begins.

| Phase | Name              | Status                            |
| ----- | ----------------- | --------------------------------- |
| 1     | Research          | ✅ merged                         |
| 2     | Architecture      | ✅ merged                         |
| 3     | Scaffolding       | ✅ merged                         |
| 4     | Business Passport | 🟡 contract done; app wiring next |
| 5     | Credit Engine     | ✅ contract + spec                |
| 6     | Funding Flow      | 🟡 backend + `loan_escrow` done; not deployed |
| 7     | Reputation System | ⏳                                |
| 8     | Demo Day          | ⏳                                |

See [docs/roadmap.md](docs/roadmap.md#calendar-roadmap--next-4-months) for the
month-by-month plan (next 4 months) behind this table.

**Verified:** contracts pass **37/37** unit tests with `soroban-sdk` 27 (`business_passport` 11,
`credit_score` 9, `loan_escrow` 17), `cargo fmt` + `clippy -D warnings` clean, including the
cross-contract reputation write, collateral-ratio enforcement, pro-rata payout on repay/default, and
the on-chain-derived (not asserted) anti-gaming rule. TypeScript packages typecheck and lint clean.
(`pnpm run format:check` has pre-existing, repo-wide failures unrelated to this work — see
`docs/backlog.md`.)

## Deploy to Testnet

The cloud sandbox has no Testnet egress, so run the deploy on a machine with internet:

```bash
rustup target add wasm32-unknown-unknown
curl -sSf https://stellar.org/install.sh | sh   # Stellar CLI
./scripts/deploy_testnet.sh                       # funds a key, deploys, wires, writes .env.local
```

## Docs

[research](docs/research.md) ·
[architecture](docs/architecture.md) ·
[ADRs](docs/adr/) ·
[score-spec](docs/score-spec.md) ·
[roadmap](docs/roadmap.md) ·
[risks](docs/risks.md) ·
[backlog](docs/backlog.md)

## Target programs

Stellar Community Fund · InstaAwards · Soroban Ecosystem · Stellar acceleration.

## License

See [LICENSE](LICENSE).
