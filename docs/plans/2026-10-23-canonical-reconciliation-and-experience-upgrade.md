# Canonical Reconciliation & Experience Upgrade Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use $subagent-driven-development to implement this plan task-by-task.

**Goal:** Reconcile the protected local release candidate onto canonical `main` without overwriting the recovered production path, then deliver and verify the connected procurement interface from public catalogue reference through controlled RFQ, order, receipt, and ETA-gated invoice evidence.

**Architecture:** Treat `origin/main` as the only source baseline and the current dirty candidate as a quarantined change set. Preserve it as immutable review evidence before applying only approved, tested changes to a canonical release-candidate commit. Keep discovery references supplier-neutral; route transactional actions through authenticated, tenant-scoped workspaces. Promote only the exact standalone artifact whose source SHA, migration status, PM2 process, Nginx upstream, and public health identity agree.

**Tech Stack:** Next.js, TypeScript, Prisma/PostgreSQL on Neon, Clerk, Vitest, Playwright, PM2, Nginx, GitHub Actions.

---

## Non-negotiable controls

- Do not reset, clean, stash, force-push, delete, or overwrite the existing worktree.
- Do not deploy from a dirty tree or directly from the legacy release `3106b51…`.
- Do not create or publish fabricated product availability, stock, Vendor identity, price, ETA clearance, EGS code, or catalogue provenance.
- Do not expose Vendor identity, source URLs, stock, private terms, or binding offers from public discovery or an unauthorised RFQ state.
- Treat all direct ETA database fixtures as isolated-test callback simulations only; no browser/API caller may self-declare an ETA UUID or signature.

## Verified starting point — 2026-10-23

- Live public health identifies `github-3106b51fb5af53ba9627b9902b1c9aef05f8fe74`; canonical GitHub `main` is `1b235aeae39b176ab60c78234e591e2db911f34d`.
- The local candidate `85042d6…` is an ancestor of `origin/main`, not a competing history. Its risk is 18 uncommitted/untracked files applied against newer `main` without review.
- Only `components/marketing/marketplace-directory.tsx` overlaps the later canonical category-specific marketplace commit `79aebf1`; that file requires a deliberate three-way resolution.
- The recovered `20261003_funder_approval_state` migration is already on canonical `main`; production migration recovery must never be re-run or replaced.
- The latest isolated Neon clone lifecycle passed 6/6 tests. Production Neon, PM2, Nginx and the live site were not changed by that test.

## Task 1: Freeze and fingerprint the candidate without mutating it

**Files:**
- Create: `docs/evidence/reconciliation/2026-10-23-candidate-manifest.json`
- Create: `docs/evidence/reconciliation/2026-10-23-candidate.patch`
- Modify: `docs/plans/2026-10-21-horeca-catalog-remediation-design.md`

**Step 1: Record immutable inputs**

Run:
```bash
git status --short --branch
git rev-parse HEAD origin/main
git diff --binary > docs/evidence/reconciliation/2026-10-23-candidate.patch
git ls-files --others --exclude-standard
shasum -a 256 docs/evidence/reconciliation/2026-10-23-candidate.patch
```

Expected: a manifest listing base SHA, canonical SHA, every modified/untracked path, and patch checksum; no tracked file changes other than the evidence record.

**Step 2: Record the release boundary**

Capture only sanitised evidence from `/api/health`, response headers, `pm2 jlist`, `nginx -T`, `df -h`, and the current release directory. Do not print environments, secrets, or logs.

**Step 3: Stop condition**

Stop if the running PM2 cwd, Nginx upstream, health `sourceCommit`, or release directory disagree. The topology conflict between the old 3057 runbook statement and the 3008 workflow must be resolved as evidence before activation.

## Task 2: Create a canonical release-candidate commit without broad overwrite

**Files:**
- Modify only paths selected from the manifest
- Create: `docs/evidence/reconciliation/2026-10-23-path-decision.md`

**Step 1: Start from canonical source**

Use a clean canonical checkout/branch only after Task 1 has preserved the candidate. Do not switch the dirty worktree. The release candidate must have parent `origin/main` at the recorded SHA.

**Step 2: Classify each candidate path**

For every path, mark one of: `adopt`, `rewrite on main`, `defer`, or `discard only with owner approval`. Group paths by concern:

1. catalogue/data model: `prisma/schema.prisma`, `prisma/migrations/20261021090000_add_horeca_catalog_staging/migration.sql`, taxonomy JSON;
2. procurement/ETA: GRN, invoice, state machine, ETA client/queue and lifecycle test;
3. public discovery/auth: proxy, marketplace component/style, detail page, selection action;
4. CSP: Clerk CSP helper and proxy;
5. shared UI tokens: `app/globals.css`;
6. evidence/tests/docs.

**Step 3: Resolve the sole source overlap manually**

In `components/marketing/marketplace-directory.tsx`, preserve canonical `initialCategory` server-state handling from `79aebf1`; add contextual Clerk modal behaviour from the candidate without deriving initial React state from `window` during server rendering. Preserve category-specific headings and empty states.

**Step 4: Test the resolution**

Add a focused test for `/marketplace?category=…` showing the selected category, a product-specific detail target, and an unauthenticated selection action that retains `catalogReference`, category and subcategory after sign-in. The test must assert no public Vendor/source/stock/offer data appears.

**Step 5: Commit boundary**

Commit only one concern at a time with tests: data model, procurement gate, discovery/auth, CSP, UI foundation. Do not mix them in a single recovery commit.

## Task 3: Establish the catalogue as controlled references, not fake inventory

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/migrations/20261021090000_add_horeca_catalog_staging/migration.sql`
- Modify: `data/staging/hospitality-catalog-taxonomy.v1.json`
- Create: `scripts/catalog/validate-import.mts`
- Create: `scripts/catalog/import-staging.mts`
- Create: `tests/integration/catalog-staging.spec.ts`

**Step 1: Write failing import tests**

Test that a row without category, technical specification, MOQ, allowed tax-code scheme, provenance URL/date, image-rights status, or review state is rejected. Test a valid reference remains supplier-neutral.

**Step 2: Implement import validation and staging only**

Use `CatalogImportBatch`, `CatalogTaxonomy`, `CatalogStagingItem`, source attribution, checksum and reviewer state. Never seed arbitrary consumer goods or call a reference a live offer.

**Step 3: Publish gate**

Expose only `PUBLISHED_REFERENCE` items whose source review and tax classification are complete. Keep estimated value labelled as a dated market reference, never availability or checkout price.

**Step 4: Verify on an expiring Neon clone**

Run `prisma migrate deploy`, `prisma migrate status`, import rejection/acceptance tests and foreign-key/null-code assertions against a fresh disposable clone. Do not migrate production.

## Task 4: Build the real hotel transaction surface

**Files:**
- Create: `app/(app)/workspace/marketplace/basket/page.tsx`
- Create: `app/(app)/workspace/marketplace/rfq/page.tsx`
- Create: `components/procurement/requirement-basket.tsx`
- Create: `components/procurement/rfq-review.tsx`
- Modify: `app/(app)/workspace/marketplace/page.tsx`
- Modify: `app/api/v2/rfq/route.ts`
- Test: `tests/p0/marketplace-rfq-context.spec.ts`
- Test: `tests/e2e/marketplace-to-rfq.spec.ts`

**Step 1: Define the basket correctly**

It is a hotel-private draft requirement basket, not a consumer retail cart. It contains selected reference, quantity, property/outlet, delivery context and requested timing; it does not contain public Vendor offers or invented stock.

**Step 2: Implement context transfer**

Product-reference selection reaches the basket after modal sign-in and remains restorable through URL/server state. A user can remove an item, adjust quantity, or continue to a structured RFQ.

**Step 3: Implement controlled RFQ creation**

The RFQ endpoint persists the basket/request, authority context and evidence requirements. Matching and Vendor disclosure remain behind controlled commercial workflow, never on the public marketplace page.

**Step 4: Browser acceptance**

With a test Hotel account: public category → product detail → sign-in modal → preserved selection → basket → RFQ confirmation. Assert direct deep links, back/refresh, error and empty states.

## Task 5: Complete order, shipping, GRN, invoice and ETA UX without weakening gates

**Files:**
- Modify: `app/(app)/orders/page.tsx`
- Create: `app/(app)/orders/[id]/page.tsx`
- Modify: `app/(app)/eta-compliance/page.tsx`
- Create: `app/(app)/receiving/page.tsx`
- Modify: `app/api/v2/grn/route.ts`
- Modify: `app/api/v2/invoices/route.ts`
- Modify: `lib/eta/client.ts`, `lib/eta/queue.ts`, `lib/auth/state-machine.ts`
- Test: `tests/integration/procurement-lifecycle.spec.ts`
- Test: `tests/e2e/order-to-receipt.spec.ts`

**Step 1: Keep the state machine as the source of truth**

Show decision-ready status and next action per role. A final GRN must display an actionable clearance-pending state and remain blocked until official callback evidence exists.

**Step 2: Implement ETA integration boundary**

Token storage/refresh, signing integration and callback handling require separately provisioned official sandbox/production credentials and a hardware-signing acceptance test. Until then show `pending external clearance`, not accepted or paid.

**Step 3: Verify two paths**

Test rejected delivery before clearance and successful delivery after callback-persisted accepted UUID/signature. Test retry/dead-letter, callback signature validation, replay protection and tenant isolation.

## Task 6: Replace generic screens with role-specific operational workspaces

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `app/(app)/suppliers/page.tsx`
- Modify: `app/(app)/carrier/page.tsx`
- Modify: `app/(app)/funding/page.tsx`
- Modify: `app/(app)/admin/**`
- Create: `components/workspaces/{hotel,vendor,carrier,funder,admin}-workspace.tsx`
- Test: `tests/p0/role-workspace-scope.spec.ts`

**Step 1: Define role scope before layout**

Hotel: draft requirements, approvals, orders, receiving exceptions. Vendor: RFQ responses after controlled access, orders, ETA invoice preparation, payment status. Carrier: assigned shipments and proof-of-delivery. Funder: authorised, post-invoice evidence only. Admin: taxonomy/review/audit and exceptions. Do not reuse a sales dashboard template.

**Step 2: Implement common components once**

Use shared status rail, evidence panel, approval action bar, record timeline and responsive data table. Each role gets only its authorised records/actions.

**Step 3: Test authorisation and deep links**

For every workspace route: signed out redirects safely; wrong tenant/role is denied; allowed role lands on the correct record context; no generic landing page replaces a clicked item.

## Task 7: Reconfigure the visual system before page-by-page redesign

**Files:**
- Modify: `app/globals.css`
- Create: `components/ui/tokens.ts`
- Create: `components/ui/interactive-states.css`
- Modify: affected marketing/workspace modules only after token adoption
- Test: `tests/p0/design-token-contract.spec.ts`

**Step 1: Define semantic tokens**

Use platinum/porcelain canvas, white data surfaces, charcoal text/chrome, grey panels/borders, and restrained Apple-style blue for focus, links and small active signals only. Remove generic saturated-blue fills and ad-hoc cobalt aliases from controls and dashboard panels.

**Step 2: Establish interaction contract**

Every action has hover, focus-visible, active, loading, disabled, empty and error state. Preserve keyboard navigation, reduced motion, 320/390/768/1024/1440 layouts and no horizontal overflow.

**Step 3: Replace brochure cards with useful GUI**

Homepage and HOVIN use compact, labelled product/workflow visuals rather than long text cards. HOVIN remains demonstrative until a native app exists; do not claim a real mobile release. Use dark mobile mock screens only as clearly illustrative assets.

**Step 4: Visual/browser acceptance**

Capture approved desktop and mobile screenshots for public marketplace, product reference, basket/RFQ, each role workspace, order, receiving and ETA-pending states. Run accessibility checks for headings, labels, images, focus, status live regions and contrast.

## Task 8: Add browser acceptance as a mandatory release gate

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/public-discovery.spec.ts`
- Create: `tests/e2e/marketplace-to-rfq.spec.ts`
- Create: `tests/e2e/role-workspaces.spec.ts`
- Create: `tests/e2e/eta-delivery-gate.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Step 1: Use disposable test tenants and mocked external providers**

Never use production Clerk users, live ETA submission, or live payment data. Seed exact role/test records through an isolated database setup.

**Step 2: Cover real click paths**

Public filter/deep link, product detail, contextual sign-in, preserved selection, requirement basket/RFQ, approval, shipment status, receiving block/pass, role route restrictions and broken-link sweep.

**Step 3: Gate build artifacts**

CI must fail if browser tests, accessibility checks, marketplace route checks, standalone smoke test, or release identity assertions fail.

## Task 9: Prove production topology and promote without overwriting recovery

**Files:**
- Modify: `docs/operations/deployment-runbook.md`
- Modify: `.github/workflows/deploy-production.yml`
- Create: `scripts/verify-release-topology.mjs`
- Create: `scripts/verify-release-identity.mjs`

**Step 1: Resolve topology conflict from live evidence**

Before release, record the exact active PM2 name/cwd/port, Nginx upstream, disk space, `HV_RELEASE_ID`, `HV_SOURCE_SHA`, and health response. Replace stale runbook statements only with this observed evidence.

**Step 2: Add pre-activation guards**

The deploy job must reject a candidate unless its parent is canonical `main`, its artifact SHA matches GitHub SHA, migrations match a restorable Neon clone rehearsal, CSP no longer contains unsafe directives, and PM2/Nginx topology matches the verified release target.

**Step 3: Stage, then activate**

Start the exact packaged standalone artifact on an isolated loopback port. Verify health identity, public routes/assets, unauthorised API/page behaviour, contextual-auth return state and browser suite. Preserve the existing live release as a rollback target before PM2 cutover.

**Step 4: Production acceptance and rollback**

After owner-approved production migration confirmation: deploy one immutable release directory, verify public health returns the exact commit/release, verify response CSP and core browser journeys, then retain the prior live artifact until the release window closes. If identity, health or browser acceptance differs, restore the preserved prior PM2 release immediately and record evidence.

## Completion definition

The reconciliation is complete only when the following are all true:

1. A reviewed canonical candidate commit contains the approved local changes without losing commits `79aebf1` through `1b235ae`.
2. The source/test/build/standalone/browser suite is green from that exact commit.
3. A clone migration rehearsal and catalogue import validation are recorded; production data remains unchanged until approval.
4. Public discovery, contextual authentication and RFQ flow are browser-proven with no dead-end redirect or Vendor/private-data disclosure.
5. Role workspaces, order/receiving/ETA states and HOVIN claims match real permissions and implementation status.
6. Production topology, deployed artifact SHA, health identity, CSP and rollback target are all verified from the same release event.
