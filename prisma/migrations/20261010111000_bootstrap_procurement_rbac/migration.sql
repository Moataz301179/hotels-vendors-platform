-- Bootstrap the minimum permissions required by the governed RFQ-to-order slice.
-- This is idempotent so it can repair existing role records without changing
-- unrelated permissions or tenant membership.
INSERT INTO "Permission" ("id", "code", "name", "description", "createdAt") VALUES
  ('perm_order_read_bootstrap', 'order:read', 'View Orders', 'View assigned procurement requests, quotes, and orders', CURRENT_TIMESTAMP),
  ('perm_order_create_bootstrap', 'order:create', 'Create Purchase Orders', 'Create procurement orders from approved commercial terms', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId", "assignedAt")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "Role" r
JOIN "Permission" p ON p."code" = 'order:read'
WHERE r."deletedAt" IS NULL
  AND r."name" IN ('Platform Admin', 'Owner', 'Hotel Manager', 'Department Head', 'Clerk', 'HOTEL_USER', 'Supplier Manager', 'SUPPLIER_USER')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId", "assignedAt")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "Role" r
JOIN "Permission" p ON p."code" = 'order:create'
WHERE r."deletedAt" IS NULL
  AND r."name" IN ('Platform Admin', 'Owner', 'Hotel Manager', 'Department Head', 'Clerk', 'HOTEL_USER')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
