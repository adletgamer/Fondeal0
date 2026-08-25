#!/usr/bin/env bash
# Deploy Fondealo contracts to Stellar Testnet.
# Requires: stellar-cli (>=27), a funded testnet identity.
#   curl -sSf https://stellar.org/install.sh | sh   # installs `stellar`
#   stellar keys generate --global deployer --network testnet --fund
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
SOURCE="${SOURCE:-deployer}"
SOROBAN_DIR="$(cd "$(dirname "$0")/../packages/soroban" && pwd)"

echo "==> Building contracts (wasm release)"
stellar contract build --manifest-path "$SOROBAN_DIR/Cargo.toml"

WASM="$SOROBAN_DIR/target/wasm32-unknown-unknown/release/business_passport.wasm"

echo "==> Optimizing"
stellar contract optimize --wasm "$WASM" || true

echo "==> Deploying business_passport"
PASSPORT_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source "$SOURCE" \
  --network "$NETWORK")
echo "business_passport deployed: $PASSPORT_ID"

echo "==> Initializing (admin=writer=$SOURCE for MVP)"
ADMIN=$(stellar keys address "$SOURCE")
stellar contract invoke \
  --id "$PASSPORT_ID" --source "$SOURCE" --network "$NETWORK" \
  -- init --admin "$ADMIN" --writer "$ADMIN"

echo ""
echo "Add to apps/web/.env.local:"
echo "NEXT_PUBLIC_PASSPORT_CONTRACT_ID=$PASSPORT_ID"
