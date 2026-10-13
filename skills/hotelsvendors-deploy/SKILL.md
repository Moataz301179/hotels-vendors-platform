---
name: hotelsvendors-deploy
description: Deploy HotelsVendors to Hostinger VPS — build mechanism verification (standalone chunk match, clean next.config.ts, rebuild, deploy, live verify). Always verify chunks before claiming success.
---

# HotelsVendors Deploy — Production Build/Deploy Mechanism

Always-on rules (apply to every deploy):

- Verify `.next/standalone/` chunks exist before deploying: `ls .next/standalone/.next/server/chunks/ssr/ | wc -l` must match rebuilt chunk count (>0). Zero chunks = broken build mechanism.
- Verify `next.config.ts` syntax before build: braces balanced, `headers()` has closing `};`, no stray `,` before `headers()`, no mktemp artifacts. If syntax error appears at line matching `.next/config` file, fix the file directly.
- Preserve `output: "standalone"` when deploying to VPS (the current deploy mechanism uses `.next/standalone/`). Changing to standard `.next/` requires different deploy approach.
- Before deploying: build exit 0 confirmed (`npm run build`), `.next/BUILD_ID` exists, `.next/standalone/server.js` exists (>14000 bytes for rebuilt server), `.next/standalone/.next/server/chunks/ssr/` has >400 chunks.
- Deploy using compressed archive (`tar -czf`, `scp`, `tar -xzf`) — direct `scp -r` times out on 67MB+ directories.
- After deploy: verify process CWD = `/var/www/hv-deploy/` (`ls -la /proc/<PID>/cwd`), port LISTEN 3000 (`ss -tlnp`), server.js md5 matches rebuilt version.
- Verify live site: `curl -I https://hotelsvendors.com/` -> HTTP 200, content >100000 bytes (rebuild produces ~105000 bytes), no `Oliv-powered`, no `CHV000`, rebuilt title/content present.
- Don't loop: one clean rebuild, one deploy, one verification cycle. Multiple redeploys without fixing mechanism = stale artifacts.
- Don't ask user for confirmation during deploy verification. Report results directly.

Pitfall (why mechanism fails): `.next/standalone/` chunk filenames change between builds (e.g., `__1ise389` vs `__1uevcl1`). The server expects chunks matching its build. Mixing chunks from different builds causes `MODULE_NOT_FOUND` and HTTP 500 (21 bytes). Always rebuild cleanly from current source.

Reference files:
- `references/standalone-chunk-fix.md` — step-by-step diagnosis and fix for chunk mismatch.
