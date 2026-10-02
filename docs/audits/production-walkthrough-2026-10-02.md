# HotelsVendors production walkthrough audit — 2026-10-02

## Scope and evidence

Audit target: `https://hotelsvendors.com`, source checkout `/private/tmp/hv-transform`, branch `production-transformation`, deployed release after the UI/auth remediation pass: `/var/www/hv-v2-a60948d-20261002` (PM2 `hotels-vendors-next-a60948d`, port 3014). The prior release `/var/www/hv-v2-0026617-20261002` remains available on port 3013 for rollback. Checks included source route inventory, live HTTP headers/statuses, auth middleware/CSP inspection, V2 API handler review, shared layout review, test/lint/build commands, and production process/nginx mapping.

This is a first walkthrough pass, not a sign-off. Authenticated end-to-end actions still require a real test account and browser session; no credentials were supplied in this task.

## Confirmed findings

### P0 — authentication/CSP integration risk

- `proxy.ts` emits a Content Security Policy whose `script-src` includes the configured Clerk instance but whose original `connect-src` omitted Clerk. The live response showed that policy. This can block Clerk API/session calls even while the widget scripts load.
- Fix applied in source: allow the configured Clerk instance, Clerk account/API domains, Clerk telemetry, Clerk WebSocket endpoints, Clerk images, and the challenge frame origin. **Must verify in a deployed browser session**; header presence alone is not proof that sign-in works.
- Unauthenticated API requests returned `401`, and protected pages redirected to `/login?redirect_url=...`. This proves the unauthenticated boundary is active; it does not prove successful sign-in, account provisioning, role-based authorization, or logout/session expiry.

### P0 — audit-log enum mismatch can break business mutations

- `appendAuditEntry` writes domain values such as `OPPORTUNITY`, `PROCUREMENT_QUOTE`, `SHIPMENT`, `ONBOARDING`, `DETECTED`, `SUBMITTED` and `STATUS_CHANGED`, but those values were absent from the Prisma `EntityName`/`ActionType` enums. Prisma can reject the audit write after the preceding business mutation has already occurred, producing a 500 response despite a partial write.
- Fix prepared in source: expand the enums and add an additive PostgreSQL migration using `ADD VALUE IF NOT EXISTS`. The first production migration attempt was blocked by an older failed phone/OTP migration; no audit-enum values were applied in that attempt. The phone/OTP migration is now being repaired idempotently against verified live objects before retrying.

### P0 — authorization and evidence controls need additional hardening

- `app/api/v2/opportunities/route.ts` allows any authenticated tenant member to request opportunity status changes. The handler has tenant scoping and transition checks, but no role/permission gate for approval/verification, and the `VERIFIED` transition does not require a validated evidence record before writing a savings ledger. A user-supplied realized amount can be persisted. This is a verified code-level gap; do not treat savings as verified until this workflow is gated and tested.
- `app/api/v2/evidence/route.ts` originally accepted caller-supplied `provenanceClass` and `confidenceScore`. Fix applied in source: provenance is now assigned as `USER_PROVIDED` with a server-set conservative confidence score; this is not a claim of independent verification.
- `lib/v2-auth.ts` bootstraps a local role from Clerk `unsafeMetadata` for non-admin roles. This is user-controlled metadata. It currently prevents self-provisioning as ADMIN, but actor role claims should be treated as onboarding intent and verified/approved server-side before granting supplier/carrier/funder permissions.
- Several API handlers check authentication and tenant IDs, but role/permission enforcement is inconsistent by operation. Fix applied in source: opportunity mutation is limited to HOTEL/ADMIN, and server-side page gates now protect admin, carrier, supplier, funding, intelligence, orders and hotel procurement routes. A complete matrix test is still required for each role × endpoint × HTTP method. The opportunity VERIFIED transition still lacks an independent evidence-review workflow and must not be treated as fully controlled.

### P1 — shared UI chrome and navigation

- The marketing homepage was the only one of the four marketing pages with a footer; platform, solutions and marketplace had no shared footer. The authenticated app layout also omitted the footer.
- Navigation hid its links below 900px with no mobile menu.
- Footer/navigation linked to routes that have no App Router page, including `/about`, `/contact`, `/support`, `/privacy`, `/terms`, `/receiving`, `/invoices`, `/eta-compliance`, and `/financing`.
- Fixes applied in source: shared marketing/app/auth/404 footer, dark footer styling, responsive mobile navigation, public Virtual Shadow overview anchor, removal of dead footer destinations, and redirect fallback behavior for Clerk sign-in/up.
- Core operational destinations such as invoice matching and receiving still do not have implemented page routes in the current route inventory; hiding dead links is not equivalent to delivering those workflows. The carrier UI can currently create a shipment with zero linked orders, and its tenant-scoped API cannot naturally discover hotel-owned orders across tenant boundaries. The funding page is read-only and `/api/v2/funding` has no create/referral action, so the external funder referral loop is not end-to-end.

### P1 — product/workflow completeness

- The current App Router contains a small surface: home, marketplace, platform, solutions, login/register, and workspace pages for dashboard, onboarding, intelligence, orders, suppliers, carrier, funding, admin and procurement. Several expected operational workflows (invoice capture/matching, receiving/GRN, inventory, integration management, reporting and supplier verification review) are absent as pages in this active source tree.
- Public marketplace query returns the intentional empty state when no verified active supplier listings exist. This avoids fabricated data but means the marketplace is not yet commercially populated.
- Dashboard/Intelligence UI uses fetch-based client state; robust loading, error, empty, unauthorized and retry behavior needs a per-page browser walkthrough, not just server-render checks.

### P1 — quality gates are not production-grade

- Linux production build passed after the shared chrome, role-gate, evidence-provenance, ingestion and unknown-route middleware fixes. The new release was canary-tested and is live behind Nginx on port 3014; the previous release remains online for rollback.
- Production HTTP smoke test: `/`, `/marketplace`, `/platform`, `/solutions`, `/login` and `/register` returned 200 with the shared footer and Clerk CSP; protected workspace routes redirected to login when signed out; `/api/v2/me` returned 401; an unknown page route returned a real 404 with the shared footer. The signed-in Clerk session and role matrix remain untested.
- Default `npm test` runs only `tests/p0/**/*.spec.ts`; after adding shell and audit-enum contracts, 2 files / 7 tests pass. It deliberately excludes broader suites. An attempted direct run of the ingestion E2E test was rejected by the config rather than executed.
- `npm run lint` reported 134 errors and 347 warnings across 444 checked files; 47 files had errors. Most errors are pre-existing and include React effect/state patterns, unsafe `any`, purity, and unescaped JSX text. The changed files themselves had zero lint errors (one image optimization warning).
- No `.github/workflows/*` files are tracked in this checkout, so there is no repository CI workflow enforcing build/test/security checks.
- Fixes applied in source: a separate `test:e2e` config/script and temporary test evidence storage so E2E tests do not clear committed test data. The E2E suite initially exposed a parser bug: the ingestion API converted the Node `Buffer` to a `Uint8Array` that ExcelJS could not parse. It now passes the `Buffer` directly; all 4 ingestion E2E tests pass and verify 25 normalized rows from the workbook.

## Source fixes in this pass

1. Add Clerk endpoints to CSP connect/frame/image directives.
2. Introduce shared route-group layouts and solid-black footer for marketing, authenticated workspace and auth pages.
3. Remove duplicate per-page nav/footer and dead footer links.
4. Add accessible mobile menu and public Virtual Shadow overview anchor.
5. Use Clerk fallback redirects instead of forcing every sign-in/up to `/dashboard`.
6. Isolate evidence-store E2E tests in temporary directories and add `npm run test:e2e`.
7. Fix ExcelJS buffer handling in the hotel-data ingestion path; the workbook now parses and normalizes 25 records in the E2E fixture.
8. Add server-side role gates for admin, carrier, supplier, funding, intelligence, orders and hotel procurement pages.
9. Make evidence provenance/confidence server-assigned and restrict opportunity mutations to hotel/admin roles.
10. Add P0 shell-contract tests for shared footer, Clerk CSP, role gates and footer route validity.
11. Let unknown page paths reach the real 404 route rather than redirecting every unknown path to login; known workspace routes and non-public APIs remain authenticated.
12. Expand the Prisma audit enums and add a safe additive migration for every domain action/entity written by `appendAuditEntry`.

## Required release gates before declaring complete

- [x] Linux production build passes for the deployed UI/auth/ingestion remediation release.
- [x] P0 shell-contract tests pass: 2 files / 7 tests.
- [x] Ingestion E2E tests pass: 1 file / 4 tests, including 25 normalized records.
- [ ] Full lint debt remains: 134 errors and 347 warnings across 444 files in the baseline run; changed files lint clean, but global lint is not green.
- [ ] Add CI workflow and make lint errors a tracked blocking gate; do not suppress the current 134 errors silently.
- [ ] Browser test sign-in, sign-up, sign-out, redirect-back, session expiry and Clerk console/network errors.
- [ ] Test all four actor roles and ADMIN against each workspace route and API method, including cross-tenant object IDs.
- [ ] Fix approval/verification and evidence-provenance controls before recording verified savings.
- [ ] Test all dashboard/API loading, error, empty and retry states.
- [ ] Implement the missing core operational workflows rather than linking to non-existent routes.
- [ ] Test desktop and mobile header/footer, brand asset, page overflow, keyboard navigation, contrast and console errors.
- [x] Deploy to a new immutable release, verify the active PM2 cwd/upstream, and run the smoke suite against production.
- [ ] Resolve the historical failed phone/OTP migration safely, apply the audit-enum migration, and confirm `prisma migrate status` is clean.
- [ ] Perform a rollback rehearsal and verify DB migration/backup recovery before production sign-off.

## Status

**Not production sign-off.** The shared chrome/CSP/role-gate/test-isolation fixes are deployed and HTTP-smoke-tested. Full authentication, role matrix, business workflow, visual browser and migration-history verification remain open until tested.
