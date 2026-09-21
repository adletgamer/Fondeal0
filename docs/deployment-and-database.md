# Deployment & database runbook

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

**If the shell cannot reach port 5432** (`P1001` even though credentials are fine), Neon also
accepts SQL over HTTPS (port 443). The `20260921000000_kyb_and_ledger` migration was applied
that way: the committed `migration.sql` was sent in one transaction to
`https://<pooler-host>/sql` (header `Neon-Connection-String`), then a row was inserted into
`_prisma_migrations` with `checksum = sha256(migration.sql with LF line endings)` — the same
value `prisma migrate deploy` would store, so `db:status` stays consistent. Verify afterwards
by querying `_prisma_migrations` and `information_schema`. Only do this for reviewed,
additive migrations.

Prisma selects every column of a model, so deploying code whose schema adds columns
(e.g. `Business.taxId`) **before** the migration is applied breaks existing queries.
Order: migrate first, then `npx vercel deploy --prod`.

Also applied: `20260921120000_passport_theme` (three nullable theme columns on `Business`).

Latest: `20260921000000_kyb_and_ledger` — additive only: KYB profile columns on `Business`,
verifier columns on `KybSubmission`, and the `LedgerEntry` table.

## Health check

`GET /api/health` runs `SELECT 1` through Prisma and returns `{ ok, db, ms }`
(HTTP 200, or 503 with `db: "down"`). It never returns connection details.
After any deploy or env change:

```bash
curl https://fondealo.vercel.app/api/health
```

## Deploying

Production is deployed with the Vercel CLI from `main` (pushes to `main` do not
auto-deploy this project):

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

- Vercel still holds the Neon-integration variables (`FONDEALO_*`, `POSTGRES_*`,
  `PG*`). Prisma does not read them; remove them once you are sure nothing else does.
- `@privy-io/server-auth` is deprecated upstream in favour of `@privy-io/node`.
- Preview and Development environments do not have the database variables yet.
- `pnpm format:check` reports files with CRLF line endings on Windows checkouts.
