#!/usr/bin/env bash
#
# Deploy Fondealo's three Soroban contracts to Stellar **Testnet**, wire them,
# verify the result on-chain and write a public manifest.
#
#   business_passport  constructor(admin, issuer)
#   credit_score       constructor(admin, passport)
#   loan_escrow        constructor(admin, passport, score, token, keeper)
#   then (admin):      passport.set_reputation_manager(score)
#                      score.set_reporter(escrow)
#
# Constructors run in the same transaction as each deployment, so no one can
# initialize a contract first. Until the two wiring calls land, nobody can
# apply reputation or report a loan outcome: the roles are unset, not open.
#
# Prerequisites: Rust (rust-toolchain.toml pins it, with the wasm32v1-none
# target), stellar-cli 28.x, node 22, and network access to Stellar Testnet.
#
# Identities live in the stellar-cli keystore under these names:
#   fondealo-admin   rotates roles, wires contracts, pays for deployment, and
#                    issues the Testnet-only FTUSD test asset
#   fondealo-issuer  issues Passports and credentials (the app server's key)
#   fondealo-keeper  defaults overdue loans, unwinds ineligible ones
# Each is taken, in order, from ADMIN_SECRET_KEY / ISSUER_SECRET_KEY /
# KEEPER_SECRET_KEY (CI), from an identity that already exists, or generated
# when GENERATE_KEYS=1 (local runs only). Secrets are never printed.
#
# Optional:
#   TOKEN_SAC_ADDRESS=C...  escrow this Stellar Asset Contract instead of FTUSD
#   WRITE_ENV_LOCAL=1       also upsert the ids into apps/web/.env.local
#
# Output: deployments/testnet.json (public data only), then scripts/verify_testnet.sh.
set -euo pipefail

NETWORK="testnet"
EXPECTED_PASSPHRASE="Test SDF Network ; September 2015"
TEST_ASSET_CODE="${TEST_ASSET_CODE:-FTUSD}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOROBAN_DIR="$ROOT/packages/soroban"
WASM_DIR="$SOROBAN_DIR/target/wasm32v1-none/release"
MANIFEST="$ROOT/deployments/testnet.json"

say() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }
net=(--network "$NETWORK")

# ---------------------------------------------------------------- preflight
say "0/8 Preflight"
command -v stellar >/dev/null ||
  die "stellar-cli not found (cargo install --locked stellar-cli --version 28.1.0 --no-default-features)"
command -v node >/dev/null || die "node not found"
CLI_VERSION="$(stellar --version | head -n1)"
case "$CLI_VERSION" in
  *" 28."* | *" 29."*) ;;
  *) die "stellar-cli 28.x expected, found: $CLI_VERSION" ;;
esac
PASSPHRASE="$(stellar network ls --long 2>/dev/null | awk -v n="$NETWORK" '
  $0 ~ "^Name: "n"$" {found=1; next}
  found && /^Network passphrase:/ {sub(/^Network passphrase: /, ""); print; exit}')"
if [ -n "$PASSPHRASE" ] && [ "$PASSPHRASE" != "$EXPECTED_PASSPHRASE" ]; then
  die "the '$NETWORK' network is not Stellar Testnet (passphrase: $PASSPHRASE)"
fi
echo "    $CLI_VERSION, network $NETWORK"

# ---------------------------------------------------------------- identities
ensure_identity() { # name env-var-holding-secret
  local name="$1" secret_var="$2"
  if [ -n "${!secret_var:-}" ]; then
    printf '%s\n' "${!secret_var}" | stellar keys add "$name" --secret-key --overwrite >/dev/null
  elif stellar keys address "$name" >/dev/null 2>&1; then
    :
  elif [ "${GENERATE_KEYS:-0}" = "1" ]; then
    stellar keys generate "$name" >/dev/null
  else
    die "no key for $name: set $secret_var, create the identity, or run with GENERATE_KEYS=1"
  fi
  stellar keys address "$name"
}

say "1/8 Identities"
ADMIN="$(ensure_identity fondealo-admin ADMIN_SECRET_KEY)"
ISSUER="$(ensure_identity fondealo-issuer ISSUER_SECRET_KEY)"
KEEPER="$(ensure_identity fondealo-keeper KEEPER_SECRET_KEY)"
[ "$ADMIN" != "$ISSUER" ] || die "admin and issuer must be different accounts"
[ "$ADMIN" != "$KEEPER" ] || die "admin and keeper must be different accounts"
echo "    admin  $ADMIN"
echo "    issuer $ISSUER"
echo "    keeper $KEEPER"

say "2/8 Fund with Friendbot (idempotent)"
for id in fondealo-admin fondealo-issuer fondealo-keeper; do
  stellar keys fund "$id" "${net[@]}" >/dev/null 2>&1 || echo "    $id: already funded"
done

# ---------------------------------------------------------------- build
say "3/8 Build (the same command CI runs)"
cargo build --manifest-path "$SOROBAN_DIR/Cargo.toml" --target wasm32v1-none --release --quiet
sha() { sha256sum "$1" | cut -d' ' -f1; }
PASSPORT_WASM="$WASM_DIR/business_passport.wasm"
SCORE_WASM="$WASM_DIR/credit_score.wasm"
ESCROW_WASM="$WASM_DIR/loan_escrow.wasm"
for w in "$PASSPORT_WASM" "$SCORE_WASM" "$ESCROW_WASM"; do
  [ -s "$w" ] || die "missing build artifact $w"
  echo "    $(basename "$w") sha256 $(sha "$w")"
done

# ---------------------------------------------------------------- token
say "4/8 Escrowed asset"
if [ -n "${TOKEN_SAC_ADDRESS:-}" ]; then
  TOKEN="$TOKEN_SAC_ADDRESS"
  TOKEN_DESC="provided"
else
  ASSET="$TEST_ASSET_CODE:$ADMIN"
  TOKEN="$(stellar contract asset deploy --asset "$ASSET" --source fondealo-admin "${net[@]}" 2>/dev/null \
    || stellar contract id asset --asset "$ASSET" "${net[@]}")"
  TOKEN_DESC="$ASSET (Testnet-only test asset)"
fi
echo "    $TOKEN_DESC -> $TOKEN"

# ---------------------------------------------------------------- deploy
deploy() { # wasm alias -- constructor args...
  local wasm="$1" alias="$2"
  shift 2
  stellar contract deploy --wasm "$wasm" --source fondealo-admin "${net[@]}" --alias "$alias" "$@"
}

say "5/8 Deploy with constructors"
PASSPORT_ID="$(deploy "$PASSPORT_WASM" fondealo-passport -- --admin "$ADMIN" --issuer "$ISSUER")"
echo "    business_passport $PASSPORT_ID"
SCORE_ID="$(deploy "$SCORE_WASM" fondealo-score -- --admin "$ADMIN" --passport "$PASSPORT_ID")"
echo "    credit_score      $SCORE_ID"
ESCROW_ID="$(deploy "$ESCROW_WASM" fondealo-escrow -- --admin "$ADMIN" --passport "$PASSPORT_ID" \
  --score "$SCORE_ID" --token "$TOKEN" --keeper "$KEEPER")"
echo "    loan_escrow       $ESCROW_ID"

say "6/8 Wire (signed by admin)"
stellar contract invoke --id "$PASSPORT_ID" --source fondealo-admin "${net[@]}" \
  -- set_reputation_manager --new_manager "$SCORE_ID" >/dev/null
stellar contract invoke --id "$SCORE_ID" --source fondealo-admin "${net[@]}" \
  -- set_reporter --new_reporter "$ESCROW_ID" >/dev/null
echo "    passport.reputation_manager -> credit_score"
echo "    credit_score.reporter       -> loan_escrow"

# ---------------------------------------------------------------- manifest
say "7/8 Manifest $MANIFEST"
mkdir -p "$(dirname "$MANIFEST")"
COMMIT="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
MANIFEST="$MANIFEST" NETWORK="$NETWORK" PASSPHRASE="$EXPECTED_PASSPHRASE" COMMIT="$COMMIT" \
  DEPLOYED_AT="$DEPLOYED_AT" CLI_VERSION="$CLI_VERSION" ADMIN="$ADMIN" ISSUER="$ISSUER" \
  KEEPER="$KEEPER" TOKEN="$TOKEN" TOKEN_DESC="$TOKEN_DESC" PASSPORT_ID="$PASSPORT_ID" \
  SCORE_ID="$SCORE_ID" ESCROW_ID="$ESCROW_ID" PASSPORT_SHA="$(sha "$PASSPORT_WASM")" \
  SCORE_SHA="$(sha "$SCORE_WASM")" ESCROW_SHA="$(sha "$ESCROW_WASM")" \
  node -e '
    const e = process.env;
    const m = {
      schema: 1,
      note: "Public data only. Stellar Testnet is reset periodically; these ids are not permanent.",
      network: e.NETWORK,
      networkPassphrase: e.PASSPHRASE,
      deployedAt: e.DEPLOYED_AT,
      gitCommit: e.COMMIT,
      stellarCli: e.CLI_VERSION,
      roles: { admin: e.ADMIN, issuer: e.ISSUER, keeper: e.KEEPER },
      token: { contractId: e.TOKEN, description: e.TOKEN_DESC },
      contracts: {
        business_passport: { id: e.PASSPORT_ID, wasmSha256: e.PASSPORT_SHA },
        credit_score: { id: e.SCORE_ID, wasmSha256: e.SCORE_SHA },
        loan_escrow: { id: e.ESCROW_ID, wasmSha256: e.ESCROW_SHA },
      },
      wiring: {
        "business_passport.reputation_manager": e.SCORE_ID,
        "credit_score.reporter": e.ESCROW_ID,
      },
    };
    require("fs").writeFileSync(e.MANIFEST, JSON.stringify(m, null, 2) + "\n");
  '

if [ "${WRITE_ENV_LOCAL:-0}" = "1" ]; then
  ENV_LOCAL="$ROOT/apps/web/.env.local"
  touch "$ENV_LOCAL"
  upsert() {
    if grep -q "^$1=" "$ENV_LOCAL"; then
      sed -i.bak "s|^$1=.*|$1=$2|" "$ENV_LOCAL" && rm -f "$ENV_LOCAL.bak"
    else
      echo "$1=$2" >>"$ENV_LOCAL"
    fi
  }
  upsert NEXT_PUBLIC_STELLAR_NETWORK testnet
  upsert NEXT_PUBLIC_PASSPORT_CONTRACT_ID "$PASSPORT_ID"
  upsert NEXT_PUBLIC_SCORE_CONTRACT_ID "$SCORE_ID"
  upsert NEXT_PUBLIC_ESCROW_CONTRACT_ID "$ESCROW_ID"
  upsert NEXT_PUBLIC_USDC_SAC_ADDRESS "$TOKEN"
  echo "    wrote apps/web/.env.local"
fi

# ---------------------------------------------------------------- verify
say "8/8 Verify on-chain"
"$ROOT/scripts/verify_testnet.sh" "$MANIFEST"

cat <<EOF

Deployed and verified on Stellar Testnet.
  business_passport  $PASSPORT_ID
  credit_score       $SCORE_ID
  loan_escrow        $ESCROW_ID
  token              $TOKEN
Explorer: https://stellar.expert/explorer/testnet/contract/$PASSPORT_ID
Commit deployments/testnet.json. For the app (Vercel, Preview):
  NEXT_PUBLIC_STELLAR_NETWORK=testnet
  NEXT_PUBLIC_PASSPORT_CONTRACT_ID=$PASSPORT_ID
  NEXT_PUBLIC_SCORE_CONTRACT_ID=$SCORE_ID
  NEXT_PUBLIC_ESCROW_CONTRACT_ID=$ESCROW_ID
  NEXT_PUBLIC_USDC_SAC_ADDRESS=$TOKEN
EOF
