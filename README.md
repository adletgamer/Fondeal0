<div align="center">

# Fondealo

**Business identity and financing infrastructure for Latin American SMEs, built with Stellar.**
_Identidad empresarial e infraestructura de financiamiento para PyMEs latinoamericanas._

`Stellar` · `Soroban` · `Next.js` · `PostgreSQL`

**Public site: [fondealo.xyz](https://fondealo.xyz)**

</div>

## Product status

Fondealo has a public website and an authenticated Business/Investor application. New business registration currently records a **sandbox KYB intake**. It does not verify a legal entity or establish creditworthiness. The financing experience uses a database-backed **test ledger**; its balances are not redeemable USDC or evidence of on-chain settlement.

[PR #13](https://github.com/adletgamer/Fondeal0/pull/13) was merged into `main` on 2026-10-11. Its code keeps sandbox applications pending and gates new financing on reviewed KYB, a current underwriting decision and a matching Passport projection. This merge does **not** verify that the database migration was applied or that Production runs the new code. Check both before making a release claim. A real Peru KYB provider, reviewer workflow, approved decision path and reconciled on-chain Passport issuance are still pending.

Read the [operating model](docs/operating-model.md) for precise capability claims and release gates.

## Intended product journey

```text
register → KYB review → underwriting → Passport issuance → financing → repayment
```

These are distinct decisions. A sandbox check is never a verified business or a lending approval. A Business Passport is intended to be a nontransferable credential backed by reviewed evidence; it is not a promise to fund every request. A paid verification response may inform underwriting, but cannot approve an application by itself.

## Repository

```text
apps/web                 Next.js app, authenticated flows and server actions
packages/database        Prisma schema and additive migrations
packages/soroban         Business Passport, credit score and loan escrow contracts
packages/sdk             Stellar client integration
packages/types           Shared domain types
packages/ui              Shared UI
docs                     Product, architecture, operations and decisions
scripts                  Development and Testnet operations
.github/workflows        Node and Soroban CI
```

The contracts compile for `wasm32v1-none` in CI. Their compilation does not establish network compatibility, deployed contract addresses, safe issuance or production readiness. Before the first Testnet deployment they were hardened ([ADR-0012](docs/adr/0012-contract-initialization-roles-and-funds-safety.md)): roles set atomically by constructors, admin separated from issuer and keeper, eligibility checks in the escrow, and refunds that cannot be blocked. Deploy and verify with the [Testnet runbook](docs/testnet-deployment.md). A contract is on Testnet only when `deployments/testnet.json` names it and `scripts/verify_testnet.sh` passes against it.

## Local development

Prerequisites: Node.js 22+, pnpm 10, Rust for contract work, and a **Development** PostgreSQL database. Copy `.env.example` to the gitignored root `.env` and use Development credentials only. See [deployment and database](docs/deployment-and-database.md) for environment precedence and connection checks.

```bash
pnpm install
pnpm --filter @fondealo/database db:generate
pnpm --filter @fondealo/database db:validate
pnpm dev
```

Validation before a PR:

```bash
pnpm run format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm contracts:test
pnpm contracts:build
```

Migration commands change the target database and are intentionally outside the quickstart. Confirm the target and review the migration before using `db:deploy`. Never run a production migration as part of local setup.

## Documentation

- [Operating model](docs/operating-model.md): current truth, trust boundaries and release gates.
- [Roadmap](docs/roadmap.md): ordered delivery stages and acceptance criteria.
- [Business approval strategy](docs/strategy/business-onboarding-underwriting-agentic-payments.md): Peru KYB, underwriting, Passport and agentic verification pilot.
- [Deployment and database](docs/deployment-and-database.md): environment and Prisma runbook.
- [Testnet deployment](docs/testnet-deployment.md): deploy, wire and verify the contracts.
- [Risk register](docs/risks.md) and [architecture decisions](docs/adr/): security and design history.
- [Documentation index](docs/README.md): which documents are current and which are historical.

## License

See [LICENSE](LICENSE).
