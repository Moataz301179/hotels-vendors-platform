# Admin security implementation decision

Status: awaiting architecture confirmation before security implementation.

The user approved implementing the admin toolkit. Inspection confirms the existing checkout remains on `ui/virtual-shadow-premium-homepage-20261003` with substantial existing changes. No branch/worktree replacement is proposed.

The supplied project guardrail G11 requires reading `docs/ARCHITECTURE_OVERHAUL_PLAN.md` before changing authentication, RBAC, tenant isolation or authority controls. This required document is absent from the checkout. The live v2 release and local v1 admin also differ. Do not invent missing architectural decisions or copy a release over local work.

## Proposed resolution

Authorize documenting the current Clerk-backed, database-role/permission architecture as the implementation baseline, subject to source and live topology verification. Preserve the existing identity provider and owner identity; do not grant new broad privileges automatically.

## Implementation contract

- One shared server-side permission boundary for admin services; deny by default.
- Explicit cross-tenant platform permissions, separate from ordinary tenant-scoped reads.
- Validated and bounded API inputs, no client-supplied identity/tenant authority.
- Recent authentication for sensitive operations, fail closed if assurance cannot be established.
- Two distinct authorized administrators for authority/financial overrides, with reason, expiry and transaction-safe execution; do not let the owner self-approve both signatures.
- Audit actor, purpose, request ID and before/after state in the same transaction as a mutation where feasible.
- Idempotency and concurrency checks for retries and monetary/status changes.
- No secret editor, raw database terminal, unsupported integration controls or unverified success notifications.
- Functional modules follow the toolkit report: organizations/access, verification, procurement, logistics/returns, finance oversight, integrations/compliance, jobs, support, reports/audit, system/security.
- Preserve the approved light-blue/white/grey/black theme.

## Acceptance and release gates

Negative permission and cross-tenant tests, sensitive-action assurance tests, dual-approval and duplicate-effect tests, scoped response checks, authenticated UI verification and production topology reconciliation must pass before deployment. Each disconnected external dependency is reported explicitly rather than simulated as operational.

Decision needed: supply the missing architecture document, or approve creating it from the verified existing architecture under this contract. This RFC does not authorize production mutation or claim implementation completion.
