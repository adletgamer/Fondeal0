# Fondealo KYB Review Console (local prototype)

This app is a local-only interface prototype for the KYB review roadmap. It uses six synthetic cases defined in `src/lib/demo-cases.ts`.

## Run locally

From the repository root:

```bash
pnpm install
pnpm --filter @fondealo/admin dev
```

Open <http://127.0.0.1:3000>. The dev server binds to loopback only. If another app is using port 3000, Next.js will report the available local port.

The app does not load the root `.env`, connect to Prisma, expose API routes, or provide decision controls. Outside `next dev`, the landing page shows a local-development-only notice. Do not configure this app as a deployed Vercel project.

## Evidence acquisition slice

The server-only evidence module now contains one x402 adapter for the fixed synthetic subject `PE:20123456789`, a deterministic spending policy, an idempotent acquisition orchestrator, and an additive Prisma migration. It does not call SUNAT or another Peruvian government service, and it never creates an underwriting decision or approves KYB.

The x402 buyer is disabled unless all local conditions are met: `NODE_ENV=development`, `ENABLE_LOCAL_X402_EVIDENCE=true`, and the server-only `SYNTHETIC_REGISTRY_X402_URL`, `SYNTHETIC_REGISTRY_ALLOWED_ORIGIN`, `SYNTHETIC_REGISTRY_PAY_TO`, `SYNTHETIC_REGISTRY_RESPONSE_PUBLIC_KEY`, and `STELLAR_TESTNET_EVIDENCE_SIGNER_SECRET` are configured. Never add the signer secret to `NEXT_PUBLIC_*`, client code, logs, or database fields. The adapter accepts only Stellar Testnet USDC, the configured recipient, and a quote under 0.02 USDC per call, 0.05 USDC per application, and 0.10 USDC per UTC day. The provider signs its normalized JSON fields with Ed25519; the adapter verifies that signature and evidence freshness before persistence.

The spend limits and database reservation are tested locally. The migration has not been applied. There is intentionally no route or UI button that can spend yet: this branch still lacks staff identity, server-side permission checks, maker-checker, and a verified isolated Development database. Wire the service to an authenticated admin action only after those foundations exist.

See [the x402 acquisition design](../../docs/rfc/0003-evidence-acquisition-x402.md) for the recorded scope and integration boundary.
