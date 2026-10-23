# packages/soroban

Fondealo's Soroban smart contracts (Rust). Cargo workspace, `soroban-sdk` 27.

## Contracts

- **`business_passport`** — the reusable, verifiable on-chain business credit
  identity. Persistent per-business record (KYB status, score, risk band,
  repayment counters, `data_hash`). Read accessors are public so any Stellar
  contract can consume the trust primitive. Two write roles: `issuer` (KYB /
  issue) and `reputation_manager` (reputation updates), both rotatable by
  `admin`. Includes a TTL subsystem so reputation survives between loans.
- **`credit_score`** — the deterministic reputation engine (see
  [`docs/score-spec.md`](../../docs/score-spec.md)). Reads the Passport, computes
  the next score, and writes it back via a cross-contract call (it is the
  Passport's `reputation_manager`). Reporter-gated; self-funded round trips are
  score-neutral (anti-gaming, R-01).
- **`loan_escrow`** — holds collateral and investor funds, distributes repayment
  or recovery, and reports loan outcomes to `credit_score`.
- **`shared`** — Passport wire types and cross-contract client interfaces. The
  deployed contract crates depend on this non-contract crate so their Wasm
  artifacts do not contain another contract's entrypoint exports.

Roles are set by each contract's **constructor**, in the same transaction as
the deployment, so nobody can initialize a contract first
([ADR-0012](../../docs/adr/0012-contract-initialization-roles-and-funds-safety.md)):

| Contract | Constructor | Set by admin after deploy |
| --- | --- | --- |
| `business_passport` | `admin`, `issuer` | `set_reputation_manager(credit_score)` |
| `credit_score` | `admin`, `passport` | `set_reporter(loan_escrow)` |
| `loan_escrow` | `admin`, `passport`, `score`, `token`, `keeper` | — |

The admin can never also be the issuer or the keeper, and admin handover is
two-step (`propose_admin`, then `accept_admin`). `loan_escrow` only creates,
funds or releases for a business whose Passport is `Active` with KYB
`Accepted`; repayments and defaults always settle, and `cancel` /
`force_cancel` refund investors in full. Credentials carry `expires_at`;
verifiers call `is_credential_valid`.

**Tests:** 72 passing (`business_passport` 31, `credit_score` 12,
`loan_escrow` 29), including the cross-contract paths, the anti-gaming rule
and exact-authorization negatives for every role.

## Develop

```bash
cargo test                                   # native unit tests
cargo fmt --all --check                      # formatting
cargo clippy --all-targets -- -D warnings    # lints
cargo build --target wasm32v1-none --release   # build wasm
```

Deploy to Testnet with `scripts/deploy_testnet.sh` and check it with
`scripts/verify_testnet.sh` (requires `stellar-cli` 28.1.0). Runbook:
[`docs/testnet-deployment.md`](../../docs/testnet-deployment.md).
