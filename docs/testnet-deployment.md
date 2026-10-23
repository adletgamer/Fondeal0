# Testnet deployment runbook

How to put Fondealo's three Soroban contracts on Stellar **Testnet**, prove they are wired correctly, and point the app at them. Testnet only: no real money, and Testnet is reset periodically, so every id here is temporary. Design decisions are in [ADR-0012](adr/0012-contract-initialization-roles-and-funds-safety.md).

## What gets deployed

| Contract | Constructor | Set after deploy (by admin) |
| --- | --- | --- |
| `business_passport` | `admin`, `issuer` | `reputation_manager` = `credit_score` |
| `credit_score` | `admin`, `passport` | `reporter` = `loan_escrow` |
| `loan_escrow` | `admin`, `passport`, `score`, `token`, `keeper` | — |

Plus a Stellar Asset Contract for the Testnet-only test asset `FTUSD`, unless you pass `TOKEN_SAC_ADDRESS`.

## Keys

Three **different** Testnet accounts. The script refuses to run if admin equals issuer or keeper.

| Identity | Holds | Who needs the secret |
| --- | --- | --- |
| `fondealo-admin` | Contract admin; pays for deployment; issues `FTUSD` | Whoever deploys and rotates roles |
| `fondealo-issuer` | Issues Passports and KYB credentials | The app server (later increments) |
| `fondealo-keeper` | Defaults overdue loans; unwinds ineligible ones | A scheduled job (later) |

Never use a Mainnet key. Never commit a secret. The manifest holds only public addresses.

## Path A: GitHub Actions (recommended)

No local setup, and every run needs your approval.

1. **Settings → Environments → New environment** `testnet`. Under *Deployment protection rules*, add yourself as a required reviewer.
2. In that environment add three secrets, each a Testnet secret key (`S…`) for a different account: `STELLAR_TESTNET_ADMIN_SECRET`, `STELLAR_TESTNET_ISSUER_SECRET`, `STELLAR_TESTNET_KEEPER_SECRET`. To create them: `stellar keys generate fondealo-admin` (and the other two), then `stellar keys secret fondealo-admin`. Or use Stellar Laboratory.
3. **Actions → Deploy contracts to Testnet → Run workflow**, type `deploy testnet`, approve the run.
4. The job builds, deploys, wires, verifies, and prints the manifest in its summary. Download the `testnet-deployment` artifact and commit it as `deployments/testnet.json`.

## Path B: your machine

Needs Rust (the repo pins the version), node 22, and:

```bash
cargo install --locked stellar-cli --version 28.1.0 --no-default-features
```

Then, from the repository root:

```bash
# First time: generate the three Testnet identities in the stellar-cli keystore.
GENERATE_KEYS=1 ./scripts/deploy_testnet.sh

# Later runs reuse the identities. To use keys from the root .env instead:
set -a; source .env; set +a; ./scripts/deploy_testnet.sh

# Also write the ids into apps/web/.env.local:
WRITE_ENV_LOCAL=1 ./scripts/deploy_testnet.sh
```

## Verify, any time

```bash
./scripts/verify_testnet.sh deployments/testnet.json
```

Read-only. It checks every role and wiring address, that the escrow is not paused, that roles are distinct, and that the Wasm on-chain hashes to what the manifest names. It exits non-zero on any difference.

## Point the app at it

In Vercel (**Preview** first), from `deployments/testnet.json`:

```
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_PASSPORT_CONTRACT_ID=<contracts.business_passport.id>
NEXT_PUBLIC_SCORE_CONTRACT_ID=<contracts.credit_score.id>
NEXT_PUBLIC_ESCROW_CONTRACT_ID=<contracts.loan_escrow.id>
NEXT_PUBLIC_USDC_SAC_ADDRESS=<token.contractId>
NEXT_PUBLIC_USDC_ASSET_CODE=FTUSD
```

What this changes today: the app reads Passports from the contract. Escrow reads fail and fall back to the database, because the SDK still calls escrow functions the contract does not have (see *Known gaps*). Funding stays on the database test ledger.

## After a Testnet reset, or to redeploy

Contracts are immutable. Run the deployment again: it creates new ids and a new manifest. Update the Vercel variables and commit the new manifest. Old ids simply stop existing after a reset.

## Known gaps (not done by this runbook)

- **Issuing Passports from the app.** The admin back-office records decisions (ADR-0011); the signing worker that calls `issue` and `add_credential` with the issuer key is a later increment.
- **SDK and indexer.** `packages/sdk`'s escrow client calls `list_opportunities` and `get_positions`, which the contract never had, and decodes statuses as text. Listing needs an event indexer, not a contract call.
- **Reputation reconciliation.** A `reputation_not_reported` event (a repayment or default on a frozen Passport) needs manual review until the indexer exists.
- **TTL.** Persistent entries archive if not touched; the `bump_ttl` job is not scheduled yet.
- **Independent security review** before any real value moves.
