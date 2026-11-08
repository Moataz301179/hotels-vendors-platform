# Release Candidate Manifest — 2026-11-08 midnight target

**Status: PROPOSED — NOT APPROVED. Nothing committed, pushed or deployed.**

## Identity

| Field | Value |
|---|---|
| Branch | `impl/sync-design-workspace` |
| Base commit | `4c9c7fab11dc2fae7dde8bcb953cc06c6ecace94` |
| Dirty entries | 126 (55 untracked, 71 modified) |
| Live release | `46002bc99f2d2bda33db716f849d15730b03a2c4` (PM2 `hotels-vendors-production`, port 3008) |
| Build command | `rm -rf .next && NODE_ENV=production npx next build` |
| Gate | `webPredeployReady:false`, `deploymentReady:false` |

## Proposed candidate scope (verified slices only)

### Application layer (six phases)
- `app/api/v2/search/route.ts` — global tenant-scoped search (read-only, RBAC, 401-first)
- `app/api/v2/action-queue/route.ts` — decision queue (read-only)
- `app/api/v2/dashboard/trends/route.ts` — six-month series
- `app/api/v2/orders/[orderId]/route.ts` — full order record
- `components/v2/command-palette.tsx`, `app-header.tsx`, `action-queue.tsx`, `workflow-chain.tsx`, `order-drawer.tsx`, `saved-views.tsx`, `sparkline.tsx`
- `components/v2/procurement-console.tsx` — catalog-default panel, assistant + calculator mounted

### Catalog
- `app/api/v2/catalog/route.ts` — anonymous shape (no `supplierId`/`unitPrice`/`sourceKey`) + buyer-safe images
- `app/api/v2/catalog/products/[productId]/images/[imageIndex]/route.ts` — `?w=` server-side resize
- `lib/catalog/buyer-safe-media.ts`, `lib/procurement/anonymous-commercial-disclosure.ts`
- `components/v2/procurement-console.tsx` — compact image frame (`clamp(100px, 12vw, 150px)`, `object-fit: contain`)

### Assistant + calculator
- `lib/fintech/fee-math.ts` — pure integer-cent / basis-point arithmetic (client-safe)
- `lib/fintech/fee-calculator.ts` — server write path, permission- and tenant-gated
- `components/v2/fee-calculator.tsx` — dashboard calculator UI
- `app/api/v2/assistant/route.ts` — honest anonymous path, deterministic `fee_calculation` tool, per-tool field visibility, input sanitization, output PII scrubbing

### Security safeguards (assistant)
- Entry gate: at least one of `order:read` / `product:read` / `invoice:read` / `fintech:read` / `report:read` / `audit:read`; otherwise 403 `ASSISTANT_PERMISSION_DENIED`.
- Field visibility: `cashflow_alerts` requires `invoice:read` or `fintech:read`; `catalog_snapshot` requires `product:read`; order/spend/RFQ/inventory tools require `order:read`. Unpermitted tools are **dropped**, not redacted.
- Untrusted input: `sanitizeMessages` + injection detection; output: `scrubMessages` PII scrubbing. Warnings returned to the client.
- Model output is never treated as instructions; no write tools exist.

### Connections authority
- `app/(app)/connections/page.tsx`, `components/v2/connections-center.tsx`
- `lib/dashboard/role-navigation.ts`
- `scripts/apply-integration-permission.mjs`, `scripts/verify-connections-authority.mjs`

### Mobile (HOVIN) — separate acceptance track
- `mobile/src/api/hovin.ts` — fail-closed origin resolution
- `mobile/app/_layout.tsx` — fail-closed configuration screen
- `mobile/app/index.tsx` — null guards
- `mobile/.env` (gitignored) — Expo env for the direct-xcodebuild path

## Tests

| Suite | Result |
|---|---|
| `npx tsc --noEmit` (web) | exit 0 |
| `npx vitest run tests/p0/` | **142 files / 599 tests pass** |
| `npx tsc --noEmit` (mobile) | exit 0 |
| `npx vitest run` (mobile) | **13/13 pass** |
| Authenticated Playwright (5 roles) | 10/10 |
| Aggregator | 2/2 |
| Connections authority script | 4/4 (authorized/denied/cross-tenant/cleanup) |

## Runtime evidence

- Catalog journey: dashboard → catalog → add → basket → persists after reload → RFQ created (isolated DB)
- Assistant: authenticated Arabic + English + follow-up, real `llama3.2:latest`, evidence citations
- Calculator: 1000 CORE = 35.00, 1000 PREMIER = 30.00, 50000 PREMIER assistant answer = 1255 (exact)
- Compact images: 149px desktop / 99px phone, 0 horizontal overflow
- Assistant authorization: hotel user sees only 4 tools (cashflow + catalog dropped); injection attempt flagged `injectionDetected: true`

## Catalogue reconciliation (definitive)

| Bucket | Count |
|---|---|
| Total products | 398 |
| FIXTURE | 200 (166 ACTIVE) |
| MANUAL | 122 (25 ACTIVE) |
| SUPPLIER_SYNC | 76 (0 ACTIVE) |
| **ACTIVE total** | **191** = 166 fixtures + 25 MANUAL |
| **Buyer-facing (fixtures excluded, verified supplier)** | **25** |

**The 25 buyer-facing records are UNVERIFIED test data, not genuine commercial records.**
Their entire distinct-name set is:

```
Verified lifecycle product · Unreviewed lifecycle product
Reviewed lifecycle towel   · HV E2E verified receiving item
```

Their suppliers are synthetic: `Supplier <32-hex-hash>` and
`HV E2E verification supplier`. `source: MANUAL` describes how the row was
entered, **not** whether the product or vendor is real.

**Conclusion: zero products in this catalogue are verified genuine.**
Buyer-facing catalogue = 0 verified products. No product image has source
evidence. Nothing was deleted.

- All 200 fixtures carry `example.com` image URLs — no real imagery.
- The 25 records: 16 use `supplier.example.test` images, 9 have no image URL.
- Fixture exclusion is enforced in `/api/v2/catalog` and `/api/v2/marketplace`
  and is covered by tests — but it does **not** exclude these MANUAL test rows.

## Exclusions — unrelated dirty work NOT in this candidate

- `data/catalog-import-results.json`, `data/catalog-revert-results.json`, `data/catalog-images/`
- `scripts/catalog-import.js`, `scripts/catalog-images-download.py`, `scripts/query-products.js`
- `docs/dry-run-catalog-import-20261107.md`
- `app/api/v2/funding/route.ts`, `app/api/v2/hotel/e-invoices/ingest/route.ts`, `tests/p0/funding-referral-lifecycle.spec.ts`, `tests/p0/hotel-einvoice-ingest.spec.ts`
- `lib/procurement/release-outbox.ts`
- Other sessions' dashboard/page edits

## Rollback

1. No migration is included — rollback is a code revert only.
2. Revert: `git revert <candidate-sha>` (or re-deploy the prior release directory `github-46002bc9…`).
3. PM2 rollback: `pm2 delete hotels-vendors-production && pm2 start .runtime-env --name hotels-vendors-production` from the prior release dir.
4. Database: no schema change in this candidate; no restore required.
5. Kill switch: `ETA_SUBMISSION_ENABLED` already `false` in production.

## Open gates — NOT waived

- `P0-REDESIGN` — open
- No real catalog imagery (all 191 active products use placeholder hosts)
- HOVIN authenticated receiving — BLOCKED (Clerk `isLoaded` never completes in the Debug build)
- Ollama bind is broader than needed (`0.0.0.0`) but **not publicly reachable** — verified externally; hardening only
- Old HOVIN binary contacted production 3× (`GET /api/v2/mobile/receipts`, all 401, read-only)

## Ollama exposure — CORRECTED after external verification

**Earlier claim was wrong.** I inferred public exposure from `ss -ltn` showing
`*:11434` without probing externally. Verified evidence:

| Check | Result |
|---|---|
| `ss -ltn` | `*:11434` (all interfaces) — the *symptom* |
| `systemctl show ollama -p Environment` | `OLLAMA_HOST=0.0.0.0:11434` — the *cause* of the bind |
| `ufw status verbose` | INPUT policy DROP; **no** `11434 ALLOW IN Anywhere` rule |
| Only 11434 rule | `172.29.88.1 11434/tcp on br-harlyos ALLOW IN 172.29.88.3 # HarlyOS production Ollama` — a **Docker bridge** rule, not public |
| External probe from this Mac | `http_code=000`, **connection timed out** — **not reachable** |

**Conclusion: port 11434 is NOT publicly reachable.** The firewall blocks it.
The bind is broader than necessary (hygiene issue), not an exposure.

**Plan (hardening, requires owner approval — not a containment emergency):**
1. Set `OLLAMA_HOST=127.0.0.1:11434` in the Ollama systemd unit.
2. Set `OLLAMA_URL` / `OLLAMA_MODEL` explicitly in `.runtime-env`.
3. Verify loopback still returns 200 and the external probe still times out.
4. **Rollback must not reopen the port**: revert `OLLAMA_HOST` only if the
   application health check still passes against a loopback-bound Ollama; if the
   app cannot reach the model, restore `0.0.0.0` and re-open the firewall rule —
   never leave a public unauthenticated AI endpoint as the fallback.

**Not applied.** No production configuration was changed.

## Owner-only decisions required

1. Approve this exact file manifest as the candidate commit.
2. Approve the production Ollama bind-address change (security).
3. Confirm catalog imagery is supplied as approved assets.
4. Approve a Clerk dev-client setup for HOVIN device testing.
