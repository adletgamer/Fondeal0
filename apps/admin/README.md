# Fondealo Admin

Internal back-office application for KYB review. Run it locally from the
repository root:

```bash
pnpm install
pnpm --filter @fondealo/admin dev
```

The current admin workflow is not enabled for operational decisions. The
capability flags in `src/lib/env.ts` remain false for staff authentication,
persisted decisions, and Passport issuance. Treat sample records as synthetic
and do not use this app to approve real businesses.

## Experimental evidence acquisition

`src/lib/evidence` contains a server-only x402 adapter for a fixed synthetic
Peru registry subject. It has a bounded Testnet spend policy, verifies signed
provider responses, and records acquisition metadata without persisting raw
provider payloads. It is not called from an admin route or UI action.

The buyer is disabled unless `NODE_ENV=development`,
`ENABLE_LOCAL_X402_EVIDENCE=true`, and all server-only provider, recipient, and
Testnet signer settings are configured. Never expose the signer secret to a
browser or commit runtime secrets. The additive database migration is not
applied; use only an isolated Development database after review.
