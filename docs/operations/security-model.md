# HotelsVendors Security Model

## Identity

Clerk is the authentication authority. The local `User` record is the business identity and authorization subject. Tenant scope and role are resolved server-side from that record; client-supplied tenant/user headers are not trusted.

## Authorization

Protected API handlers call `authenticate()` and then server-side RBAC/tenant checks. Edge middleware performs authentication gating only; it does not make business-role decisions.

## Audit

Business and security events are written to the `AuditLog` hash chain. Appends are serialized with a PostgreSQL advisory transaction lock. Production also installs `prisma/manual/001_audit_immutability.sql` so ordinary application UPDATE/DELETE operations on the audit table are rejected.

## Database reality

The production Neon database contains migrations that are present in the database migration table but not in this repository. These are treated as an out-of-band live schema baseline until their original migration sources are recovered. Do not run `prisma migrate reset`, `db push`, or destructive schema reconciliation against production.
