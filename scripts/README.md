# scripts

Operational scripts for Fondealo.

- `deploy_testnet.sh` — build the three contracts, deploy them to Stellar
  Testnet with their constructors, wire them, write the public manifest
  `deployments/testnet.json`, then verify. Needs `stellar-cli` 28.1.0 and three
  distinct Testnet keys (admin, issuer, keeper).
- `verify_testnet.sh [manifest]` — read-only check of a deployment: every role
  and wiring address, the pause flag, and the on-chain Wasm hash against the
  manifest. Exits non-zero on any difference.

Full runbook, including the GitHub Actions path:
[`docs/testnet-deployment.md`](../docs/testnet-deployment.md).

## TTL bumper (Phase 4/7)

Persistent Soroban entries archive when their TTL expires. A scheduled job will
call `bump_ttl(business)` on the Passport contract for active businesses to keep
reputation alive across long inactivity. Tracked as backlog item **C5**.
