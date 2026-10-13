-- Keep the procurement permission catalog present on every environment. Existing
-- role assignments are preserved; this only adds missing, explicit grants.
INSERT INTO "Permission" ("id", "code", "name", "description") VALUES
  ('perm_order_approve_bootstrap', 'order:approve', 'Approve Purchase Orders', 'Approve purchase orders after authority and guarantee checks'),
  ('perm_order_reject_bootstrap', 'order:reject', 'Reject Purchase Orders', 'Reject purchase orders with an auditable reason'),
  ('perm_order_confirm_bootstrap', 'order:confirm', 'Confirm Purchase Orders', 'Confirm an approved purchase order'),
  ('perm_order_update_bootstrap', 'order:update', 'Update Purchase Orders', 'Advance an authorized purchase order lifecycle')
ON CONFLICT ("code") DO UPDATE SET "deletedAt" = NULL;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r CROSS JOIN "Permission" p
WHERE p."code" IN ('order:approve', 'order:reject', 'order:confirm', 'order:update')
  AND r."name" IN ('Owner', 'Hotel Manager', 'Department Head', 'HOTEL_APPROVER_E2E')
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET "deletedAt" = NULL;
