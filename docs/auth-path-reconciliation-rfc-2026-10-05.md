# RFC: Reconcile HotelsVendors Authentication Paths

**Status:** Proposed; decision required before auth-path implementation  
**Date:** 2026-10-05  
**Owner:** Product owner / HotelsVendors account owner

## Problem

The current checkout contains two identity paths that disagree about which credential grants access:

1. The active web shell uses Clerk: `ClerkProvider`, Clerk `<SignIn>`, Clerk middleware, and a registration-time `/api/v1/auth/clerk-sync` provisioning call.
2. Legacy handlers `/api/v1/auth/login` and `/api/v1/auth/refresh` issue and rotate custom `hv_session` JWTs. The same middleware explicitly ignores that cookie and rejects protected APIs without a Clerk `userId`.

This can create successful-looking legacy login responses that do not unlock the current web app. The production pages also reference a Clerk `accounts.dev` host, preventing representative real-user signup and authenticated acceptance testing.

The audit, GRN, logistics, mobile, and finance work depends on one clear server-side identity and tenant context. Fixing only a redirect or exposing the legacy handlers would leave the underlying split in place.

## Evidence

- `app/layout.tsx` mounts `ClerkProvider`.
- `app/(auth)/login/page.tsx` renders Clerk `<SignIn>`; `app/(auth)/register/page.tsx` posts to `/api/v1/auth/clerk-sync`.
- `middleware.ts` obtains `userId` from Clerk, injects session claims, and states that legacy `hv_session` cookies are ignored.
- `lib/session.ts` signs a custom JWT in an `hv_session` cookie. `app/api/v1/auth/login/route.ts` creates it; `app/api/v1/auth/refresh/route.ts` rotates sessions and refresh records.
- The mobile API client calls `/api/v1/auth/refresh`; the rest of its identity lifecycle needs verification before retiring or changing this contract.
- Read-only public GETs on 2026-10-05 showed login/register HTML referencing an `accounts.dev` Clerk host. No credentials or account data were inspected.

## Options

### A. Clerk for web; a bounded mobile token bridge only if required

Keep Clerk as the sole browser identity authority, consistent with the current web shell. Resolve every web user to a stable HotelsVendors database identity and derive tenant/role permissions server-side. Retain a separate mobile token exchange only if the supported mobile client needs it; define its audience, expiry, revocation, tenant derivation, and authorization checks explicitly. Do not treat client-editable Clerk `unsafeMetadata` as authority for organization role or tenant.

**Benefits:** aligns with the current web direction; one browser login and session path; minimizes account migration.  
**Cost:** a mobile bridge may remain, but its boundary can be explicit and tested.

### B. Custom JWT as the sole authority

Restore the `hv_session` flow as the single source for web and mobile, and replace Clerk middleware/components with a reviewed custom authentication path.

**Benefits:** one credential/session format across clients.  
**Cost:** reverses the current web implementation and requires a complete review of password, verification, recovery, session rotation/revocation, CSRF, and migration behavior.

### C. Two active authorities

Support Clerk and custom JWT as peers with explicit token-to-account mapping and route-specific policy.

**Benefits:** least immediate compatibility break.  
**Cost:** highest complexity and risk of mismatched tenant, role, expiry, logout, and audit identity; requires substantially more acceptance coverage.

## Recommendation

Choose **Option A** for web because the current shell, sign-in UI, and middleware already declare Clerk as the web authority. Keep the mobile refresh API unchanged until the client authentication lifecycle and supported mobile release are inspected; do not represent its current behavior as verified. The user must decide whether the mobile token bridge is a supported product contract or legacy code to retire.

Before implementing the web path, provision and validate production Clerk configuration through the approved secret-management channel; do not copy or print keys into this repository. The current development host is not acceptable for production account testing.

## Acceptance criteria after the decision

- Web sign-up, verified email, sign-in, sign-out, recovery, and expired-session behavior pass in a production-configured test tenant.
- The server maps the verified identity to exactly one active account and tenant; role and tenant come from server-controlled records.
- Registration errors return a correlation ID and safe actionable state without logging email, tokens, cookies, or secret claims.
- Every protected API authenticates first, derives tenant from the verified session/account record, applies the database-backed permission policy, and rejects cross-tenant reads and writes.
- The web path never treats an `hv_session` token as an alternate browser identity.
- If mobile token exchange remains supported, tests cover login, refresh rotation, reuse/revocation, expiry, logout, tenant scoping, and error behavior independently.
- Account creation and audit records are atomic or have a durable recovery path; retries do not create duplicate tenants/users/audit events.
- No schema migration or production configuration change occurs without its separate approval and rollback plan.

## Decision

- [ ] Approve A: Clerk web authority; keep mobile token bridge only if verified as supported
- [ ] Approve B: custom JWT as the only authority
- [ ] Select C or another explicit architecture and document the supported clients

No authentication implementation choice is inferred from this proposed RFC.
