# Consolidated Product Intelligence and Forensic Findings — 2026-10-11

## Method

Two independent read-only reviews covered the isolated web release and the mobile source. Findings below are source-evidenced; they are not claims that production controls are active.

## Corrective actions completed

1. **Supplier RFQ visibility and creation** — RFQ creation now creates the tenant-bound supplier grant in the same transaction; supplier RFQ and quote listings use only active, non-revoked grants. Focused tests cover the boundary.
2. **Direct order bypass** — `/api/v2/orders` POST is closed. Orders must originate from the accepted quote path, which preserves source terms, RFQ linkage, authority evaluation, payment-gate handling, and audit evidence.
3. **Clean mobile remediation branch** — `codex/mobile-platform-reconciliation-20261011` is separate from the dirty mobile checkout. It removes the reachable legacy field/cash-out routes, removes the supplier cash-out action, makes Clerk the only mobile bearer-token source, clears cart state on logout, and fails closed on incomplete tenant profile responses.

## Release blockers still open

| Priority | Finding | Required proof or correction |
| --- | --- | --- |
| P0 | Web and mobile API contracts diverge. Mobile calls v2 paths but retains legacy-shaped client flows. | A versioned contract test covering Clerk identity, `/me`, catalog, RFQ, quote acceptance, GRN and logout against the release candidate. |
| P0 | A person can still encounter a separate native credential flow in legacy mobile screens. | Remove remaining legacy login/OTP surfaces and prove a Clerk-native web/mobile account yields the same user, tenant and platform role. |
| P0 | No department-to-category entitlement model exists in the current v2 catalog/RFQ path. | Persist department category grants, enforce them in catalog and procurement APIs, and test API denial as well as mobile views. |
| P0 | Audit immutability trigger is manual SQL, not an applied verified migration. | Capture release-candidate evidence for trigger existence, denied update/delete, append, and full-chain verification. |
| P1 | Dual-sign-off orders are denied but not routed into a durable two-approver workflow. | Persist approvals, require distinct approved identities/roles, and append audit entries before final state transition. |
| P1 | FACTORING and ADMIN roles have no defined mobile operating contract; old field/finance surfaces contain unsupported outcomes. | Define each role as web-only or mobile-capable and deny unsupported mobile access. |
| P1 | Posted invoice/financial values are editable in legacy UI. | Keep those routes unavailable until amounts, supplier identity and ETA evidence are server-derived from immutable records. |

## Explicit non-actions

- No production database migration, release cutover, or PM2 change was made.
- No old mobile artifact was deleted beyond the stale local Simulator app. The current inventory contains no installed HotelsVendors/HOVIN application on the booted iOS Simulator and no connected Android target. Historical releases require an explicit target list before deletion.
- No claim of biometric login, real-device Clerk validation, immutable audit enforcement, or production acceptance is made yet.
