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

Wiring order at deploy: deploy both → `passport.init(admin, issuer, score_id)` →
`score.init(admin, passport_id, reporter)`. See `scripts/deploy_testnet.sh`.
Each `init` requires authorization from the proposed `admin`; the deployment
transaction must include that account's signature. This prevents an unrelated
account from claiming the one-time initialization and selecting privileged roles.

**Tests:** 50 passing (`business_passport` 24, `credit_score` 9,
`loan_escrow` 17), including the cross-contract paths and anti-gaming rule.

## Develop

```bash
cargo test                                   # native unit tests
cargo fmt --all --check                      # formatting
cargo clippy --all-targets -- -D warnings    # lints
cargo build --target wasm32v1-none --release   # build wasm
```

Deploy to Testnet with `scripts/deploy_testnet.sh` (requires `stellar-cli`).
