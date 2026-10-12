# Deployment & database runbook

> Updated 2026-10-11. This runbook records a previous incident and the current
> deployment sequence. It does not authorize a Production migration or deploy.
> Read the [operating model](operating-model.md) and the Stage 1 release checklist
> in [the roadmap](roadmap.md) before acting.

How environment variables, Prisma and the Vercel deploy fit together — and the
incident that broke login in production.

## Environment variables

The **repo-root `.env`** (gitignored) is the single source of truth locally.

| Consumer | How it gets the variables |
| --- | --- |
| Next.js (`apps/web`) | `next.config.mjs` calls `process.loadEnvFile('../../.env')`. It never overrides variables already set, so `apps/web/.env.local` and Vercel's real environment win. |
| Prisma CLI (`packages/database`) | `db:validate`, `db:status`, `db:migrate`, `db:deploy`, `db:studio` run through `dotenv -e ../../.env --`. `db:generate` runs bare so it also works on Vercel, where no `.env` file exists. |
| Vercel | Project environment variables (Production / Preview / Development). |

| Variable | Scope | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | server | Pooled Neon connection (`-pooler` host) used by Prisma at runtime. |
| `DATABASE_URL_UNPOOLED` | server | Direct Neon connection (no `-pooler`) used as `directUrl` by Prisma Migrate. |
| `NEON_AUTH_JWKS_URL` | server | Public JWKS of Neon Auth / the Neon Data API (`…/neondb/auth/.well-known/jwks.json`). Not a secret; not read by the app today (login uses Privy) — kept for verifying Neon-issued JWTs if the Data API is adopted. |
| `NEXT_PUBLIC_PRIVY_APP_ID` | public | Privy app id. |
| `PRIVY_APP_SECRET` | server | Verifies Privy identity tokens. Never `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_STELLAR_NETWORK`, `_SOROBAN_RPC_URL`, `_HORIZON_URL`, `_NETWORK_PASSPHRASE` | public | Stellar/Soroban endpoints (used by `@fondealo/sdk`, not by login). |
| `NEXT_PUBLIC_*_CONTRACT_ID`, `NEXT_PUBLIC_USDC_*` | public | Deployed contract ids / USDC SAC — empty until contracts are deployed. |

Never put real values in `.env.example`, docs, logs or commits.

## Database scripts

```bash
pnpm --filter @fondealo/database db:generate   # prisma generate
pnpm --filter @fondealo/database db:validate   # prisma validate (reads root .env)
pnpm --filter @fondealo/database db:status     # prisma migrate status
pnpm --filter @fondealo/database db:deploy     # prisma migrate deploy (apply committed migrations)
pnpm --filter @fondealo/database db:migrate    # prisma migrate dev (create a new migration)
```

`schema.prisma` sets `binaryTargets = ["native", "rhel-openssl-3.0.x"]`: the
second target is Vercel's Amazon Linux runtime.

## Applying migrations (do this BEFORE deploying code that needs them)

Migrations are applied with Prisma from a machine that can reach the database (some
sandboxed shells block Postgres ports):

```bash
pnpm --filter @fondealo/database db:status   # what is pending
pnpm --filter @fondealo/database db:deploy   # apply pending migrations
```

**Historical exception:** when this machine could not reach PostgreSQL on port 5432,
the `20260921000000_kyb_and_ledger` migration was applied through Neon's HTTPS SQL
interface and its Prisma migration history was reconciled. Do not use that path
to bypass a network restriction. For new migrations, first establish approved
PostgreSQL connectivity, verify the database target and use the reviewed Prisma
procedure. Any manual migration-history change requires a separate incident
record, database review and independent verification.

Prisma selects every column of a model, so deploying code whose schema adds columns
(e.g. `Business.taxId`) **before** the migration is applied breaks existing queries.
Order after an approved release decision: target verification → migration preflight
and isolated test → Production migration → app deployment → health and
trust/money smoke tests → monitor or rollback. Never deploy code requiring a
new table ahead of its migration.

Also applied: `20260921120000_passport_theme` (three nullable theme columns on `Business`).

The repository also contains the pending
`20261011000000_underwriting_decisions` migration from merged PR #13. It adds
`UnderwritingDecision` and a partial unique index for active KYB intake.
Its Production application status is **unverified** here. Check existing `Processing` rows
for duplicates, then test it on the isolated Development database before
considering any wider rollout.

The KYB evidence intake PR adds `20261012000000_kyb_evidence_intake`: three
append-only/reference tables and nullable consent/idempotency columns. Apply
it only after the underwriting migration, first on isolated Development after
confirming its Neon branch and reviewing duplicate active submissions. This
PR does not apply either migration or authorize a Production deploy. A failed
Prisma status or TCP connection is a blocked database gate, not a passed test.

Read-only Development preflight after connectivity is restored (report counts,
not business identifiers):

```sql
SELECT migration_name, finished_at IS NOT NULL AS applied
FROM "_prisma_migrations"
WHERE migration_name IN (
  '20261011000000_underwriting_decisions',
  '20261012000000_kyb_evidence_intake'
);

SELECT COUNT(*) AS businesses_with_duplicate_processing
FROM (
  SELECT "businessId"
  FROM "KybSubmission"
  WHERE status = 'Processing'
  GROUP BY "businessId"
  HAVING COUNT(*) > 1
) AS duplicates;

SELECT COUNT(*) AS partially_funded_open_opportunities
FROM "Opportunity"
WHERE status = 'Open' AND funded ~ '^[0-9]+$' AND funded::numeric > 0;
```

Do not apply either migration if the target branch is not proven to be isolated
Development or the preflight reveals duplicate active applications. Inventory
partially funded opportunities and agree a ledger-reconciled disposition before
any wider rollout.

## Health check

`GET /api/health` runs `SELECT 1` through Prisma and returns `{ ok, db, ms }`
(HTTP 200, or 503 with `db: "down"`). It never returns connection details.
After any deploy or env change:

```bash
curl https://fondealo.xyz/api/health
```

## Deploying

Historically, Production has been deployed with the Vercel CLI from `main`
(a push to `main` does not itself deploy this project). Run this only after
the release gates above are signed off:

```bash
git checkout main && git pull
npx vercel deploy --prod --yes
```

`.vercelignore` keeps Rust build artefacts out of the upload.
Environment variable changes only apply to deployments created afterwards.

## Incident — login broken in production (2026-09)

**Symptom.** Neither Business nor Investor users could complete login: they were
bounced back to `/onboarding`, or `chooseRole` answered "Couldn't save your
role — the database may be unreachable". The `UserWallet` table was empty.

**Root cause.** Not Neon, not Privy. On Vercel every Prisma call failed with
`Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"`.
With pnpm + a monorepo, Next's file tracing does not copy Prisma's native query
engine into the server bundle. `getSession()` swallowed the error and returned
`role: null` (fail-closed), so every user looked role-less, and `chooseRole()`
could never persist a role.

**Fix.** `binaryTargets` in `schema.prisma` plus
`@prisma/nextjs-monorepo-workaround-plugin` in `apps/web/next.config.mjs`.
Verified with `/api/health` returning `ok: true` on production.

**Lessons.**
- A database that "works locally" proves nothing about the serverless bundle —
  keep `/api/health` in the post-deploy check.
- The auth path swallows errors silently (`session.ts` catch blocks). If login
  regresses, add temporary `console.error` there first and read the Vercel logs
  (`npx vercel logs <deployment-url> --no-follow --expand`).
- Sandboxed shells can block Postgres ports (5432/6543). Use the Neon HTTPS SQL
  endpoint or `/api/health` to test connectivity from such environments.

## Known follow-ups

- Audit any legacy Neon-integration variables (`FONDEALO_*`, `POSTGRES_*`,
  `PG*`) before removal; Prisma's current datasource uses `DATABASE_URL` and
  `DATABASE_URL_UNPOOLED`.
- Review the installed Privy server SDK and its migration path in a separate
  dependency change; do not bundle it with database or underwriting releases.
- Development database variables were connected to the isolated Neon
  `fondealo-development` database in the earlier environment setup. Verify
  their current assignment before use; Preview has not been changed as part of
  PR #13, and Production must remain isolated.
