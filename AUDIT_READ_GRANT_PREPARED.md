TARGETED IDEMPOTENT audit:read GRANT (NOT APPLIED — development-only seed patch)

Current state (prisma/seed.ts):
- audit:read is in the Owner role permissions array (line 137).
- Not granted to Platform Admin, Hotel Manager, Department Head, Clerk,
  Supplier Manager, Factoring Agent, Logistics Coordinator.

Intended roles (dashboards that render audit widgets):
- Owner: already granted (line 137).
- Hotel Manager / Department Head: should see their delegated team's audit.
- Supplier Manager / Logistics Coordinator: should see their team's actions.
- Platform Admin: already has full admin; could also hold it.

Idempotent approach (development seed only; never in production migrations):
1. In roleDefs array, add "audit:read" to permissions arrays for roles above.
2. Re-run seed in a non-production environment: `npx prisma db seed`.
3. The seed's upsert logic (line 163) is idempotent: `update:{}` means the grant
   is applied without overwriting other role properties.
4. Production permission changes must be applied through the admin endpoint
   (app/api/v2/admin/user-permissions/route.ts) with audit:read allowlisted,
   or through a separate admin-controlled script — never through this dev seed.

Not executed. Not committed. Not pushed.
