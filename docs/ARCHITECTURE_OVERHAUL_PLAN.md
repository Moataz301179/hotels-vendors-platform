# Verified architecture baseline and admin implementation plan

Approved direction: user confirmation on 7 October 2026 authorizes documenting the existing architecture and implementing stronger admin controls. This is continuation, not replacement.

## Source of truth

Use `/Users/Moatazi/hotels-vendors-new` on its existing branch. Preserve all dirty changes. The production snapshot is a different, older v2 route surface; local v1 changes require reconciliation and verification before release. Never copy a release over this checkout.

## Existing boundaries

- Clerk supplies browser identity; `lib/auth/server-auth.ts` resolves a verified primary email to the active application account. Native bearer authentication uses the existing separate mobile-session path.
- Application database roles and permissions, not Clerk social-login choice or client state, govern business access. `lib/auth/rbac.ts` checks active user/tenant and role ownership. Global roles are limited to ADMIN accounts in PLATFORM tenants.
- Prisma uses PostgreSQL. `AuthContext` carries server-resolved user ID, tenant ID and platform role.
- Root `app/` is the local route tree. New APIs use `/api/v1/`. Existing admin pages are under `(admin)`; new admin pages use `(dashboard)/admin` with a server permission layout. No wholesale route migration in this work.
- Existing authority override service uses an order lock and two independent authenticated administrators with transactional audit records. It must not manufacture a payment guarantee.

## Required changes

1. Centralize platform-read and sensitive-write boundaries: explicit permissions, no inferred owner superuser privilege, recent Clerk verification for sensitive browser writes, deny unsupported bearer assurance.
2. Global directory queries require explicit cross-tenant permission and active PLATFORM admin identity. Validate enums, bound pagination, omit deleted records, disable response caching.
3. Overview metadata explicitly identifies platform scope. Platform transactional totals require the cross-tenant permission and active PLATFORM identity; ordinary tenant queries remain scoped.
4. Configuration controls never claim changes they did not perform. Environment updates stay outside the UI until a controlled deployment mechanism exists.
5. Control-center tools are enabled only with authorized backend support. External connections, backups and certifications are not presumed operational.
6. Two-person approval must recheck both parties' active grants; payment guarantees cannot be waived. Transactions, audit integrity, idempotency and concurrency safeguards are release gates.

## Interface and rollout

Keep the approved light-blue/white/grey/black palette. Group organizations/access, verification, procurement, logistics, finance, integrations, automation, support, audit/reports and system/security. No fabricated metrics or inactive actions presented as usable.

Implement foundational hardening first, then connected UI modules. Test unauthorized access, cross-tenant access, validation bounds, recent verification, independent approval and honest errors. Full build and authenticated browser checks follow. Production deployment remains gated by source reconciliation, live configuration and rollback evidence; this document is not proof of production readiness.
