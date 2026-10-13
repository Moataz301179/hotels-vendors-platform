-- The governance trigger is shared by four tables. Dispatch by relation OID,
-- not TG_TABLE_NAME, so PostgreSQL always evaluates NEW against the correct
-- row shape (quoted table names can otherwise be normalized unexpectedly).
CREATE OR REPLACE FUNCTION hv_assert_governance_tenant_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  expected_tenant_id TEXT;
BEGIN
  IF TG_RELID = 'public."User"'::regclass THEN
    IF NEW."departmentId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "Department" d
      WHERE d.id = NEW."departmentId" AND d."tenantId" = NEW."tenantId"
        AND d."isActive" = true AND d."deletedAt" IS NULL
    ) THEN
      RAISE EXCEPTION 'Department must be active and belong to the user tenant';
    END IF;
  ELSIF TG_RELID = 'public."DepartmentCategoryAccess"'::regclass THEN
    IF NEW."createdById" IS NOT NULL THEN
      SELECT d."tenantId" INTO expected_tenant_id
      FROM "Department" d WHERE d.id = NEW."departmentId";
      IF expected_tenant_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM "User" u
        WHERE u.id = NEW."createdById" AND u."tenantId" = expected_tenant_id
          AND u.status = 'ACTIVE' AND u."deletedAt" IS NULL
      ) THEN
        RAISE EXCEPTION 'Category-access grant creator must be active in the department tenant';
      END IF;
    END IF;
  ELSIF TG_RELID = 'public."ProcurementApprovalPolicy"'::regclass THEN
    IF NEW."departmentId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "Department" d
      WHERE d.id = NEW."departmentId" AND d."tenantId" = NEW."tenantId"
        AND d."isActive" = true AND d."deletedAt" IS NULL
    ) THEN
      RAISE EXCEPTION 'Approval-policy department must be active and belong to the policy tenant';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = NEW."primaryApproverId" AND u."tenantId" = NEW."tenantId"
        AND u.status = 'ACTIVE' AND u."deletedAt" IS NULL
    ) THEN
      RAISE EXCEPTION 'Primary approver must be active in the policy tenant';
    END IF;
    IF NEW."secondaryApproverId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = NEW."secondaryApproverId" AND u."tenantId" = NEW."tenantId"
        AND u.status = 'ACTIVE' AND u."deletedAt" IS NULL
    ) THEN
      RAISE EXCEPTION 'Secondary approver must be active in the policy tenant';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = NEW."createdById" AND u."tenantId" = NEW."tenantId"
        AND u.status = 'ACTIVE' AND u."deletedAt" IS NULL
    ) THEN
      RAISE EXCEPTION 'Approval-policy creator must be active in the policy tenant';
    END IF;
  ELSIF TG_RELID = 'public."Order"'::regclass THEN
    IF NEW."departmentId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "Department" d
      WHERE d.id = NEW."departmentId" AND d."tenantId" = NEW."tenantId"
    ) THEN
      RAISE EXCEPTION 'Order department must belong to the order tenant';
    END IF;
    IF NEW."procurementApprovalPolicyId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "ProcurementApprovalPolicy" p
      WHERE p.id = NEW."procurementApprovalPolicyId" AND p."tenantId" = NEW."tenantId"
    ) THEN
      RAISE EXCEPTION 'Order approval policy must belong to the order tenant';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
