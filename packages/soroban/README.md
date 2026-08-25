# packages/soroban

Fondealo's Soroban smart contracts (Rust). Cargo workspace, `soroban-sdk` 27.

## Contracts

- **`business_passport`** — the reusable, verifiable on-chain business credit
  identity. Persistent per-business record (KYB status, score, risk band,
  repayment counters, `data_hash`). Read accessors are public so any Stellar
  contract can consume the trust primitive; writes are gated to an authorized
  `writer` (rotatable by `admin`). Includes a TTL subsystem so reputation
  survives between loans.

Planned (next phases): `credit_score` (Phase 5), `loan_escrow` (Phase 6).

## Develop

```bash
cargo test                                   # native unit tests
cargo fmt --all --check                      # formatting
cargo clippy --all-targets -- -D warnings    # lints
cargo build --target wasm32-unknown-unknown --release   # build wasm
```

Deploy to Testnet with `scripts/deploy_testnet.sh` (requires `stellar-cli`).
