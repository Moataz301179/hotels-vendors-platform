# Standalone Chunk Fix — Reference

Root cause: Turbopack `.next/standalone/` produces chunk filenames that don't match server expectations when `next.config.ts` is broken (syntax errors prevent clean rebuild). After fixing `next.config.ts`, rebuild produces consistent chunks.

Diagnosis steps (use installed tools):
1. `read_file` `next.config.ts` -> check syntax (brace balance, extra commas, missing `headers()` closing)
2. `execute_code` with `find`/`ls` to check `.next/standalone/.next/server/chunks/ssr/` count
3. `execute_code` to compare `.next/BUILD_ID` with deployed version

Fix steps:
1. Fix `next.config.ts` syntax (add `headers()` closing, remove stray commas/mktemp artifacts)
2. Rebuild: `npm run build` must exit 0
3. Verify: `.next/standalone/` exists, `.next/BUILD_ID` exists, chunks count > 0
4. Deploy: `tar -czf /tmp/standalone.tar.gz -C .next/standalone .`, `scp`, `tar -xzf` on VPS
5. Restart: `kill -9` old PID, `fuser -k 3000/tcp`, `nohup node server.js`
6. Verify live: `curl -I https://hotelsvendors.com/` -> HTTP 200, content > 100000 bytes

Always verify chunks before deploying. Don't trust `npm run build` exit code alone — verify artifacts.
