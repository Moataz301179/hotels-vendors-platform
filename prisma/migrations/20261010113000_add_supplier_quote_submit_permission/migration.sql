-- Supplier-only commercial mutation permission. Do not use order read for quote submission.
INSERT INTO "Permission" ("id", "code", "name", "description", "createdAt") VALUES
  ('perm_quote_submit_bootstrap', 'quote:submit', 'Submit Supplier Quotes', 'Submit a fixed response to an explicitly granted RFQ', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId", "assignedAt")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "Role" r
JOIN "Permission" p ON p."code" = 'quote:submit'
WHERE r."deletedAt" IS NULL
  AND r."name" IN ('Supplier Manager', 'SUPPLIER_USER')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
