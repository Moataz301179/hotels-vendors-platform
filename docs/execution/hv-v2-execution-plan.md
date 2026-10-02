# HotelsVendors V2 Execution Plan

## Verified baseline (2026-10-02)
- Repository: `Moataz301179/hotels-vendors-platform`.
- Working copy: `/Users/Moatazi/hv-v2-work` (isolated clone; clean at start).
- Branch: `production-transformation`.
- Source commit: `3db4fd31c2e12c1479c5a0f0a559d4abd819e203`.
- Public production checks: `/` 200; `/logo-white.svg` 200; `/api/health` 200; `/api/v2/me` 401 unauthenticated; `/dashboard` redirects to `/login`.
- Production SSH inspection is BLOCKED: host key verification failed and no known-host entry exists. Do not bypass host-key verification. Verify host identity through a trusted channel before SSH operations.
- The separate `/Users/Moatazi/hotels-vendors-new` checkout has extensive unrelated dirty changes and is not this task's worktree.

## Scope and sequencing
1. **P0 Security:** remove authorization decisions derived from Clerk `unsafeMetadata`; require a verified primary email; deny inactive/deleted users; test provisioning and unauthorized access.
2. **P0 Reproducibility:** install from lockfile in this isolated copy; run Prisma validation/generation, lint, type-check, tests and production build; record exact results.
3. **P0 Runtime reconciliation:** verify live release/process/build against this source using a trusted SSH host identity or an approved deployment/monitoring channel.
4. **P1 Procurement:** implement a real demand/RFQ/quote/order/fulfillment/outcome slice with tenant scoping, transitions, idempotency and audit events.
5. **P1 Virtual Shadow:** trace evidence to findings, opportunities, actions, statuses and outcomes; distinguish verified facts from hypotheses.
6. **P1 Actor workspaces:** make Hotel, Supplier, Carrier and Funder flows functional and server-authorized.
7. **P1 Commercial tracking:** persist distinct procurement revenue and external funder referral events without claiming unverified revenue.
8. **P2 Operations/UI:** monitoring, failure recovery, backup/restore proof, docs, responsive polished UI and end-to-end acceptance tests.

## Acceptance policy
- A task is DONE only after its acceptance criteria and relevant tests pass.
- A build is not proof of authorization, tenant isolation, business completion or revenue.
- No fabricated business records or metrics.
- No production DB changes, destructive operations, host-key bypass, or deployment until environment identity and recovery gates are verified.
