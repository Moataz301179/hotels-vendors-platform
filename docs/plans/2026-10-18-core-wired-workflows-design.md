# Core Wired Workflows Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use $subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace decorative procurement touchpoints with one connected, permission-checked hotel workflow: evidence-backed catalog discovery, RFQ, comparable commercial response, approval, goods receipt, and reviewable physical counts.

**Architecture:** Keep business state and authorization in existing v2 route handlers backed by Prisma. The web dashboard becomes a role-specific entry point to those handlers; buyer-facing catalog and quote responses remain anonymous to prevent disclosure of supplier-private commercial relationships. Physical count capture creates a pending-review record only and never changes stock autonomously.

**Tech Stack:** Next.js App Router route handlers, React, Clerk server authentication, Prisma/PostgreSQL, Vitest, Expo mobile client in its separate repository.

---

### Task 1: Make the buyer catalog a safe, usable entry point

**Files:**
- Create: `lib/catalog/buyer-safe-media.ts`
- Create: `app/api/v2/catalog/products/[productId]/images/[imageIndex]/route.ts`
- Modify: `app/api/v2/marketplace/route.ts`
- Modify: `components/v2/procurement-console.tsx`
- Test: `tests/p0/buyer-safe-catalog-media.spec.ts`
- Test: `tests/p0/buyer-catalog-media-route.spec.ts`
- Test: `tests/p0/marketplace-catalog-anonymity.spec.ts`

**Step 1:** Write route and disclosure tests that require authentication, active verified source records, fixed image bounds, and no supplier identity in a hotel response.

**Step 2:** Run `npm test -- buyer-safe-catalog-media buyer-catalog-media-route marketplace-catalog-anonymity` and confirm red before implementation.

**Step 3:** Implement authenticated opaque image delivery and anonymous catalog response mapping.

**Step 4:** Update the procurement console so catalog cards use only buyer-safe fields and RFQ is the commercial action.

**Step 5:** Run the focused tests; commit `feat: wire buyer-safe catalog workflow`.

### Task 2: Give every operational role a connected workspace

**Files:**
- Create: `lib/dashboard/role-workspace.ts`
- Modify: `app/api/v2/dashboard/route.ts`
- Modify: `app/(app)/dashboard/page.tsx`
- Test: `tests/p0/role-workspace.spec.ts`
- Test: `tests/p0/dashboard-role-context.spec.ts`

**Step 1:** Write tests for the receiving clerk, financial controller, and management workspaces and for returning the organization role from the authenticated dashboard API.

**Step 2:** Run `npm test -- role-workspace dashboard-role-context` and confirm red.

**Step 3:** Implement the role-to-action mapping with only routes that already perform an actual authorized action.

**Step 4:** Render role-workspace tasks beneath real dashboard metrics.

**Step 5:** Run focused tests; commit `feat: connect role workspaces to operations`.

### Task 3: Capture physical counts without autonomous inventory adjustment

**Files:**
- Create: `lib/inventory/physical-counts.ts`
- Create: `app/api/v2/inventory/counts/route.ts`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261018070000_add_physical_inventory_counts/migration.sql`
- Test: `tests/p0/physical-count-input.spec.ts`
- Test: `tests/p0/physical-count-route-contract.spec.ts`

**Step 1:** Write validation and route-contract tests for tenant isolation, idempotency, receipt of a pending-review record, and prohibition on immediate stock adjustment.

**Step 2:** Run `npm test -- physical-count-input physical-count-route-contract` and confirm red.

**Step 3:** Add the additive schema model and migration, then implement read-scoped barcode resolution and serialized count recording with an audit entry.

**Step 4:** Verify `npx prisma migrate status` shows precisely the new migration pending in the clean release workspace; do not apply it to shared or production data.

**Step 5:** Run focused tests; commit `feat: add reviewable physical count capture`.

### Task 4: Prepare a controlled release

**Files:**
- Modify: `.github/workflows/deploy-production.yml` only if it can run `prisma migrate deploy` with an explicit pre-activation backup/restore gate.
- Test: full Vitest suite, `npx tsc --noEmit`, `npm run build`, `git diff --check`.

**Step 1:** Rebase or recreate this clean release branch from the current remote `main`; never merge untracked build output or the mixed working tree.

**Step 2:** Before any deployment database change, prove the target database identity, create a restorable backup or branch, and run `prisma migrate deploy` plus smoke tests against that isolated copy.

**Step 3:** Push the reviewed commits and trigger the existing production workflow only once the migration gate is demonstrably safe.

**Step 4:** Verify the exact live release identity and authenticated buyer acceptance test; report release only when both succeed.
