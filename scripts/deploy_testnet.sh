#!/usr/bin/env bash
#
# Deploy Fondealo contracts to Stellar Testnet and wire them together.
#
# Prerequisites (run on a machine WITH internet — the cloud sandbox has none):
#   1. Rust + wasm target:   rustup target add wasm32-unknown-unknown
#   2. Stellar CLI (>=27):   curl -sSf https://stellar.org/install.sh | sh
#                            (Windows: winget install --id Stellar.StellarCLI  — or use WSL)
#
# Usage:
#   export DEPLOYER_SECRET=S...        # optional; if unset, a new key is generated + funded
#   ./scripts/deploy_testnet.sh
#
# Result: deploys business_passport + credit_score, initializes and wires roles,
# and writes contract ids to apps/web/.env.local and deployments/testnet.json.
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
RPC_URL="${RPC_URL:-https://soroban-testnet.stellar.org}"
PASSPHRASE="${PASSPHRASE:-Test SDF Network ; September 2015}"
ID="${DEPLOYER_ID:-fondealo-deployer}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOROBAN_DIR="$ROOT/packages/soroban"

net_args=(--rpc-url "$RPC_URL" --network-passphrase "$PASSPHRASE")

echo "==> 1/6 Deployer identity"
if ! stellar keys address "$ID" >/dev/null 2>&1; then
  if [ -n "${DEPLOYER_SECRET:-}" ]; then
    printf '%s' "$DEPLOYER_SECRET" | stellar keys add "$ID" --secret-key
  else
    stellar keys generate "$ID" --network "$NETWORK"
  fi
fi
DEPLOYER=$(stellar keys address "$ID")
echo "    deployer: $DEPLOYER"

echo "==> 2/6 Fund via Friendbot (idempotent)"
stellar keys fund "$ID" --network "$NETWORK" || echo "    (already funded, continuing)"

echo "==> 3/6 Build contracts (wasm release)"
stellar contract build --manifest-path "$SOROBAN_DIR/Cargo.toml"
WASM_DIR="$SOROBAN_DIR/target/wasm32-unknown-unknown/release"
PASSPORT_WASM="$WASM_DIR/business_passport.wasm"
SCORE_WASM="$WASM_DIR/credit_score.wasm"
stellar contract optimize --wasm "$PASSPORT_WASM" || true
stellar contract optimize --wasm "$SCORE_WASM" || true

echo "==> 4/6 Deploy contracts"
PASSPORT_ID=$(stellar contract deploy --wasm "$PASSPORT_WASM" --source "$ID" --network "$NETWORK" "${net_args[@]}")
echo "    business_passport: $PASSPORT_ID"
SCORE_ID=$(stellar contract deploy --wasm "$SCORE_WASM" --source "$ID" --network "$NETWORK" "${net_args[@]}")
echo "    credit_score:      $SCORE_ID"

echo "==> 5/6 Initialize + wire roles"
# Passport: admin=issuer=deployer (MVP), reputation_manager = the score contract.
stellar contract invoke --id "$PASSPORT_ID" --source "$ID" --network "$NETWORK" "${net_args[@]}" \
  -- init --admin "$DEPLOYER" --issuer "$DEPLOYER" --reputation_manager "$SCORE_ID"
# Score: admin=deployer, passport=PASSPORT_ID, reporter=deployer (escrow later).
stellar contract invoke --id "$SCORE_ID" --source "$ID" --network "$NETWORK" "${net_args[@]}" \
  -- init --admin "$DEPLOYER" --passport "$PASSPORT_ID" --reporter "$DEPLOYER"

echo "==> 6/6 Write env + manifest"
mkdir -p "$ROOT/deployments"
cat > "$ROOT/deployments/testnet.json" <<JSON
{
  "network": "testnet",
  "rpcUrl": "$RPC_URL",
  "networkPassphrase": "$PASSPHRASE",
  "deployer": "$DEPLOYER",
  "contracts": {
    "business_passport": "$PASSPORT_ID",
    "credit_score": "$SCORE_ID"
  }
}
JSON

ENV_LOCAL="$ROOT/apps/web/.env.local"
touch "$ENV_LOCAL"
upsert() { # key value file
  if grep -q "^$1=" "$3" 2>/dev/null; then
    sed -i.bak "s|^$1=.*|$1=$2|" "$3" && rm -f "$3.bak"
  else
    echo "$1=$2" >> "$3"
  fi
}
upsert NEXT_PUBLIC_STELLAR_NETWORK testnet "$ENV_LOCAL"
upsert NEXT_PUBLIC_SOROBAN_RPC_URL "$RPC_URL" "$ENV_LOCAL"
upsert NEXT_PUBLIC_PASSPORT_CONTRACT_ID "$PASSPORT_ID" "$ENV_LOCAL"
upsert NEXT_PUBLIC_SCORE_CONTRACT_ID "$SCORE_ID" "$ENV_LOCAL"

echo ""
echo "Done. Deployed to Testnet:"
echo "  business_passport = $PASSPORT_ID"
echo "  credit_score      = $SCORE_ID"
echo "Wrote apps/web/.env.local and deployments/testnet.json"
echo "View: https://stellar.expert/explorer/testnet/contract/$PASSPORT_ID"
