#!/usr/bin/env bash
set -euo pipefail
track="${1:?specialty required}"
mkdir -p recovery-reports
case "$track" in
 auth-tenancy) cmd='npx vitest run tests/p0/' ;;
 procurement) cmd='npm run test:integration' ;;
 quality) cmd='npm test' ;;
 frontend) cmd='npm run build && (PORT=3100 HOSTNAME=127.0.0.1 npm start >recovery-reports/frontend-server.log 2>&1 & server=$!; trap "kill $server 2>/dev/null || true" EXIT; for i in $(seq 1 50); do if curl -fsS http://127.0.0.1:3100/api/health >/dev/null; then break; fi; sleep 2; done; npx playwright test)' ;;
 build-release) cmd='npm run build' ;;
 data-integrity) cmd='node scripts/verify-live-procurement-schema.mjs' ;;
 *) echo "Unknown engineering specialty: $track" >&2; exit 2 ;;
esac
printf '%s\n' "Specialty: $track" "Command: $cmd" > "recovery-reports/${track}.txt"
set +e
bash -o pipefail -c "$cmd" 2>&1 | tee -a "recovery-reports/${track}.txt"
status=${PIPESTATUS[0]}
set -e
printf '\nExit code: %s\n' "$status" >> "recovery-reports/${track}.txt"
exit "$status"
