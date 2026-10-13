# Owner administrator bootstrap

User approval: promote the verified Apple-linked account pss.alexandria@gmail.com to platform administrator (7 October 2026), without pausing for each implementation step.

This is a targeted account/role configuration operation, not an authentication or RBAC architecture rewrite. The referenced ARCHITECTURE_OVERHAUL_PLAN.md is absent. No missing design is represented as read or implemented.

Identity gate: exactly one production Clerk identity, user_3KKzJQ3IPM5evb2YQlwJHPkEysl, verified primary email and oauth_apple provider. Exact database account cmux7e4h80004cr3f9plk75bc must be active and presently HOTEL.

Create or reuse an active PLATFORM tenant and a global Platform Admin role. Grant only admin:read, admin:manage_tenants, admin:manage_platform, user:read, user:update, supplier:read, supplier:update, audit:read and report:read. Do not grant monetary approval or authority overrides. Preserve the old tenant and all its records; refuse transfer if the account has linked buyer/supplier/funder identities.

Perform role creation, permission assignment and exact account transfer in a serializable transaction. Record before/after snapshots in the existing append-only audit chain using its canonical hash format and advisory lock. Never run the general seed script.

Verification: read back the account, global role and grants; confirm the stored audit hash; then use the existing authenticated browser to load /admin and verify audit records. Report the current admin panel's actual capabilities rather than claiming a complete operational control center.
