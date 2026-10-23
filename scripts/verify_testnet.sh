#!/usr/bin/env bash
#
# Check a Fondealo Testnet deployment against its manifest, read-only:
# every role and wiring address, the escrow's pause flag, and that the Wasm
# running on-chain is byte-for-byte the Wasm the manifest names.
#
#   scripts/verify_testnet.sh [deployments/testnet.json]
#
# The manifest names its network (testnet, or local for a rehearsal).
#
# Calls are simulated (`--send=no`), so nothing is signed or paid for.
# VERIFY_SOURCE names the identity used as the simulation source
# (default: fondealo-admin; any funded Testnet identity works).
# Exits non-zero if anything differs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="${1:-$ROOT/deployments/testnet.json}"
SOURCE="${VERIFY_SOURCE:-fondealo-admin}"
[ -s "$MANIFEST" ] || { echo "error: no manifest at $MANIFEST" >&2; exit 1; }

get() { node -e 'const m=require(process.argv[1]); console.log(process.argv[2].split(".").reduce((o,k)=>o[k],m))' "$MANIFEST" "$1"; }

NETWORK="$(get network)"
case "$NETWORK" in
  testnet | local) ;;
  *) echo "error: manifest is for '$NETWORK', expected testnet (or local)" >&2; exit 1 ;;
esac
net=(--network "$NETWORK")

ADMIN="$(get roles.admin)"
ISSUER="$(get roles.issuer)"
KEEPER="$(get roles.keeper)"
TOKEN="$(get token.contractId)"
PASSPORT="$(get contracts.business_passport.id)"
SCORE="$(get contracts.credit_score.id)"
ESCROW="$(get contracts.loan_escrow.id)"

fail=0
check() { # label expected actual
  if [ "$2" = "$3" ]; then
    printf '  ok    %s\n' "$1"
  else
    printf '  FAIL  %s: expected %s, got %s\n' "$1" "$2" "$3"
    fail=1
  fi
}
call() { # contract-id function
  stellar contract invoke --id "$1" --source "$SOURCE" "${net[@]}" --send=no -- "$2" 2>/dev/null \
    | tr -d '"' || echo "<call failed>"
}

echo "Roles and wiring"
check "business_passport.admin" "$ADMIN" "$(call "$PASSPORT" admin)"
check "business_passport.issuer" "$ISSUER" "$(call "$PASSPORT" issuer)"
check "business_passport.reputation_manager" "$SCORE" "$(call "$PASSPORT" reputation_manager)"
check "credit_score.admin" "$ADMIN" "$(call "$SCORE" admin)"
check "credit_score.passport" "$PASSPORT" "$(call "$SCORE" passport)"
check "credit_score.reporter" "$ESCROW" "$(call "$SCORE" reporter)"
check "loan_escrow.admin" "$ADMIN" "$(call "$ESCROW" admin)"
check "loan_escrow.keeper" "$KEEPER" "$(call "$ESCROW" keeper)"
check "loan_escrow.passport" "$PASSPORT" "$(call "$ESCROW" passport)"
check "loan_escrow.score" "$SCORE" "$(call "$ESCROW" score)"
check "loan_escrow.token" "$TOKEN" "$(call "$ESCROW" token)"
check "loan_escrow.paused" "false" "$(call "$ESCROW" paused)"
check "roles are distinct (admin != issuer)" "yes" "$([ "$ADMIN" != "$ISSUER" ] && echo yes || echo no)"
check "roles are distinct (admin != keeper)" "yes" "$([ "$ADMIN" != "$KEEPER" ] && echo yes || echo no)"

echo "Wasm on-chain matches the manifest"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
for name in business_passport credit_score loan_escrow; do
  id="$(get "contracts.$name.id")"
  want="$(get "contracts.$name.wasmSha256")"
  if stellar contract fetch --id "$id" "${net[@]}" --out-file "$tmp/$name.wasm" >/dev/null 2>&1; then
    check "$name wasm sha256" "$want" "$(sha256sum "$tmp/$name.wasm" | cut -d' ' -f1)"
  else
    check "$name wasm sha256" "$want" "<fetch failed>"
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "Verification FAILED" >&2
  exit 1
fi
echo "Verification passed"
