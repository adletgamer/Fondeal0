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
#   export USDC_SAC_ADDRESS=C...       # required; the USDC Stellar Asset Contract on this network
#   export KEEPER_ADDRESS=G...         # optional; defaults to the deployer (rotate later via set_keeper)
#   ./scripts/deploy_testnet.sh
#
# Result: deploys business_passport + credit_score + loan_escrow, initializes
# and wires roles (loan_escrow becomes credit_score's reporter), and writes
# contract ids to apps/web/.env.local and deployments/testnet.json.
#
# There is no fixed, well-known USDC SAC address to fall back to — Testnet
# USDC issuers rotate and a wrong guess would silently escrow the wrong
# asset. Pass the one the app should trust via USDC_SAC_ADDRESS.
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
RPC_URL="${RPC_URL:-https://soroban-testnet.stellar.org}"
PASSPHRASE="${PASSPHRASE:-Test SDF Network ; September 2015}"
ID="${DEPLOYER_ID:-fondealo-deployer}"

if [ -z "${USDC_SAC_ADDRESS:-}" ]; then
  echo "error: USDC_SAC_ADDRESS is required (the USDC Stellar Asset Contract to escrow)." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOROBAN_DIR="$ROOT/packages/soroban"

net_args=(--rpc-url "$RPC_URL" --network-passphrase "$PASSPHRASE")

echo "==> 1/7 Deployer identity"
if ! stellar keys address "$ID" >/dev/null 2>&1; then
  if [ -n "${DEPLOYER_SECRET:-}" ]; then
    printf '%s' "$DEPLOYER_SECRET" | stellar keys add "$ID" --secret-key
  else
    stellar keys generate "$ID" --network "$NETWORK"
  fi
fi
DEPLOYER=$(stellar keys address "$ID")
echo "    deployer: $DEPLOYER"

echo "==> 2/7 Fund via Friendbot (idempotent)"
stellar keys fund "$ID" --network "$NETWORK" || echo "    (already funded, continuing)"

KEEPER="${KEEPER_ADDRESS:-$DEPLOYER}"

echo "==> 3/7 Build contracts (wasm release)"
stellar contract build --manifest-path "$SOROBAN_DIR/Cargo.toml"
WASM_DIR="$SOROBAN_DIR/target/wasm32-unknown-unknown/release"
PASSPORT_WASM="$WASM_DIR/business_passport.wasm"
SCORE_WASM="$WASM_DIR/credit_score.wasm"
ESCROW_WASM="$WASM_DIR/loan_escrow.wasm"
stellar contract optimize --wasm "$PASSPORT_WASM" || true
stellar contract optimize --wasm "$SCORE_WASM" || true
stellar contract optimize --wasm "$ESCROW_WASM" || true

echo "==> 4/7 Deploy contracts"
PASSPORT_ID=$(stellar contract deploy --wasm "$PASSPORT_WASM" --source "$ID" --network "$NETWORK" "${net_args[@]}")
echo "    business_passport: $PASSPORT_ID"
SCORE_ID=$(stellar contract deploy --wasm "$SCORE_WASM" --source "$ID" --network "$NETWORK" "${net_args[@]}")
echo "    credit_score:      $SCORE_ID"
ESCROW_ID=$(stellar contract deploy --wasm "$ESCROW_WASM" --source "$ID" --network "$NETWORK" "${net_args[@]}")
echo "    loan_escrow:       $ESCROW_ID"

echo "==> 5/7 Initialize roles"
# Passport: admin=issuer=deployer (MVP), reputation_manager = the score contract.
stellar contract invoke --id "$PASSPORT_ID" --source "$ID" --network "$NETWORK" "${net_args[@]}" \
  -- init --admin "$DEPLOYER" --issuer "$DEPLOYER" --reputation_manager "$SCORE_ID"
# Score: admin=deployer, passport=PASSPORT_ID, reporter=deployer initially —
# rewired to the escrow contract once it exists (next step).
stellar contract invoke --id "$SCORE_ID" --source "$ID" --network "$NETWORK" "${net_args[@]}" \
  -- init --admin "$DEPLOYER" --passport "$PASSPORT_ID" --reporter "$DEPLOYER"
# Escrow: admin=deployer, wired to passport/score/USDC, keeper=$KEEPER.
stellar contract invoke --id "$ESCROW_ID" --source "$ID" --network "$NETWORK" "${net_args[@]}" \
  -- init --admin "$DEPLOYER" --passport "$PASSPORT_ID" --score "$SCORE_ID" \
     --token "$USDC_SAC_ADDRESS" --keeper "$KEEPER"

echo "==> 6/7 Wire loan_escrow as credit_score's reporter"
stellar contract invoke --id "$SCORE_ID" --source "$ID" --network "$NETWORK" "${net_args[@]}" \
  -- set_reporter --new_reporter "$ESCROW_ID"

echo "==> 7/7 Write env + manifest"
mkdir -p "$ROOT/deployments"
cat > "$ROOT/deployments/testnet.json" <<JSON
{
  "network": "testnet",
  "rpcUrl": "$RPC_URL",
  "networkPassphrase": "$PASSPHRASE",
  "deployer": "$DEPLOYER",
  "keeper": "$KEEPER",
  "usdcSacAddress": "$USDC_SAC_ADDRESS",
  "contracts": {
    "business_passport": "$PASSPORT_ID",
    "credit_score": "$SCORE_ID",
    "loan_escrow": "$ESCROW_ID"
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
upsert NEXT_PUBLIC_ESCROW_CONTRACT_ID "$ESCROW_ID" "$ENV_LOCAL"
upsert NEXT_PUBLIC_USDC_SAC_ADDRESS "$USDC_SAC_ADDRESS" "$ENV_LOCAL"

echo ""
echo "Done. Deployed to Testnet:"
echo "  business_passport = $PASSPORT_ID"
echo "  credit_score      = $SCORE_ID"
echo "  loan_escrow       = $ESCROW_ID"
echo "  reporter wiring   = credit_score.reporter -> loan_escrow"
echo "Wrote apps/web/.env.local and deployments/testnet.json"
echo "View: https://stellar.expert/explorer/testnet/contract/$PASSPORT_ID"
