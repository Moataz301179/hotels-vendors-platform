#!/usr/bin/env bash
set -euo pipefail

test_url="${HV_TEST_DATABASE_URL:-}"
if [ -z "$test_url" ]; then
  echo "HV_TEST_DATABASE_URL must point to an explicitly local disposable PostgreSQL database." >&2
  exit 1
fi

node - "$test_url" <<'VERIFY_TEST_DATABASE'
const url = new URL(process.argv[2]);
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !localHosts.has(url.hostname)) {
  throw new Error('HV_TEST_DATABASE_URL must use a local PostgreSQL host.');
}
VERIFY_TEST_DATABASE

DATABASE_URL="$test_url" npx prisma db push --skip-generate
