# scripts

Operational scripts for Fondealo.

- `deploy_testnet.sh` — build, deploy, and initialize the `business_passport`
  contract on Stellar Testnet using `stellar-cli`. Prints the contract id to add
  to `apps/web/.env.local`.

## TTL bumper (Phase 4/7)

Persistent Soroban entries archive when their TTL expires. A scheduled job will
call `bump_ttl(business)` on the Passport contract for active businesses to keep
reputation alive across long inactivity. Tracked as backlog item **C5**.
