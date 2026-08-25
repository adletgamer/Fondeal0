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

Wiring order at deploy: deploy both → `passport.init(admin, issuer, score_id)` →
`score.init(admin, passport_id, reporter)`. See `scripts/deploy_testnet.sh`.

Planned (next phase): `loan_escrow` (Phase 6).

**Tests:** 20/20 passing (`business_passport` 11, `credit_score` 9), including the
cross-contract path and anti-gaming rule.

## Develop

```bash
cargo test                                   # native unit tests
cargo fmt --all --check                      # formatting
cargo clippy --all-targets -- -D warnings    # lints
cargo build --target wasm32-unknown-unknown --release   # build wasm
```

Deploy to Testnet with `scripts/deploy_testnet.sh` (requires `stellar-cli`).
