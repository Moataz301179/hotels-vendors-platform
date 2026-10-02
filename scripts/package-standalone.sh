#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STANDALONE="$ROOT/.next/standalone"

if [[ ! -f "$STANDALONE/server.js" ]]; then
  echo "ERROR: Next standalone server not found at $STANDALONE/server.js; run npm run build first." >&2
  exit 1
fi
if [[ ! -d "$ROOT/.next/static" ]]; then
  echo "ERROR: .next/static is missing; refusing to package an incomplete UI." >&2
  exit 1
fi
if [[ ! -d "$ROOT/public" || ! -f "$ROOT/public/logo-white.svg" ]]; then
  echo "ERROR: required public asset public/logo-white.svg is missing." >&2
  exit 1
fi
mkdir -p "$STANDALONE/.next/static" "$STANDALONE/public"
cp -a "$ROOT/.next/static/." "$STANDALONE/.next/static/"
cp -a "$ROOT/public/." "$STANDALONE/public/"
test -f "$STANDALONE/public/logo-white.svg"
test -d "$STANDALONE/.next/static"
echo "Standalone package verified: server.js, .next/static, and public/logo-white.svg are present."
