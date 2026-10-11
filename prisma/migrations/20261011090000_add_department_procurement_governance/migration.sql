-- Tenant-scoped administrator controls for department catalog access and PO approval routing.
CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Department_tenantId_code_key" ON "Department"("tenantId", "code");
CREATE INDEX "Department_tenantId_deletedAt_idx" ON "Department"("tenantId", "deletedAt");
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DepartmentCategoryAccess" (
  "id" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "category" "ProductCategory" NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DepartmentCategoryAccess_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DepartmentCategoryAccess_departmentId_category_key" ON "DepartmentCategoryAccess"("departmentId", "category");
ALTER TABLE "DepartmentCategoryAccess" ADD CONSTRAINT "DepartmentCategoryAccess_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepartmentCategoryAccess" ADD CONSTRAINT "DepartmentCategoryAccess_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD COLUMN "departmentId" TEXT;
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProcurementApprovalPolicy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "departmentId" TEXT,
  "minAmount" DECIMAL(12,2),
  "maxAmount" DECIMAL(12,2),
  "primaryApproverId" TEXT NOT NULL,
  "secondaryApproverId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ProcurementApprovalPolicy_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProcurementApprovalPolicy_tenantId_departmentId_active_idx" ON "ProcurementApprovalPolicy"("tenantId", "departmentId", "isActive");
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_primaryApproverId_fkey" FOREIGN KEY ("primaryApproverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_secondaryApproverId_fkey" FOREIGN KEY ("secondaryApproverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_amount_range_check" CHECK ("minAmount" IS NULL OR "minAmount" >= 0);
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_max_amount_range_check" CHECK ("maxAmount" IS NULL OR "maxAmount" >= 0);
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_ordered_amount_range_check" CHECK ("minAmount" IS NULL OR "maxAmount" IS NULL OR "maxAmount" >= "minAmount");
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_distinct_approvers_check" CHECK ("secondaryApproverId" IS NULL OR "secondaryApproverId" <> "primaryApproverId");

ALTER TABLE "Order" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "procurementApprovalPolicyId" TEXT;
ALTER TABLE "Order" ADD COLUMN "approvalPolicySnapshot" JSONB;
CREATE INDEX "Order_departmentId_idx" ON "Order"("departmentId");
CREATE INDEX "Order_procurementApprovalPolicyId_idx" ON "Order"("procurementApprovalPolicyId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_procurementApprovalPolicyId_fkey" FOREIGN KEY ("procurementApprovalPolicyId") REFERENCES "ProcurementApprovalPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Every cross-model governance reference must remain in the owning tenant.
-- Prisma cannot represent these tenant-paired foreign keys without duplicating
-- the tenant column across relations, so PostgreSQL enforces the invariant.
CREATE OR REPLACE FUNCTION hv_assert_governance_tenant_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  expected_tenant_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'User' AND NEW."departmentId" IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM "Department" d
      WHERE d.id = NEW."departmentId" AND d."tenantId" = NEW."tenantId"
        AND d."isActive" = true AND d."deletedAt" IS NULL
    ) THEN
      RAISE EXCEPTION 'Department must be active and belong to the user tenant';
    END IF;
  ELSIF TG_TABLE_NAME = 'DepartmentCategoryAccess' AND NEW."createdById" IS NOT NULL THEN
    SELECT d."tenantId" INTO expected_tenant_id FROM "Department" d WHERE d.id = NEW."departmentId";
    IF expected_tenant_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = NEW."createdById" AND u."tenantId" = expected_tenant_id
        AND u.status = 'ACTIVE' AND u."deletedAt" IS NULL
    ) THEN
      RAISE EXCEPTION 'Category-access grant creator must be active in the department tenant';
    END IF;
  ELSIF TG_TABLE_NAME = 'ProcurementApprovalPolicy' THEN
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
  ELSIF TG_TABLE_NAME = 'Order' THEN
    IF NEW."departmentId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "Department" d WHERE d.id = NEW."departmentId" AND d."tenantId" = NEW."tenantId"
    ) THEN
      RAISE EXCEPTION 'Order department must belong to the order tenant';
    END IF;
    IF NEW."procurementApprovalPolicyId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "ProcurementApprovalPolicy" p WHERE p.id = NEW."procurementApprovalPolicyId" AND p."tenantId" = NEW."tenantId"
    ) THEN
      RAISE EXCEPTION 'Order approval policy must belong to the order tenant';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER hv_user_department_tenant_guard
BEFORE INSERT OR UPDATE OF "departmentId", "tenantId" ON "User"
FOR EACH ROW EXECUTE FUNCTION hv_assert_governance_tenant_integrity();
CREATE TRIGGER hv_department_category_access_tenant_guard
BEFORE INSERT OR UPDATE OF "departmentId", "createdById" ON "DepartmentCategoryAccess"
FOR EACH ROW EXECUTE FUNCTION hv_assert_governance_tenant_integrity();
CREATE TRIGGER hv_procurement_policy_tenant_guard
BEFORE INSERT OR UPDATE OF "tenantId", "departmentId", "primaryApproverId", "secondaryApproverId", "createdById" ON "ProcurementApprovalPolicy"
FOR EACH ROW EXECUTE FUNCTION hv_assert_governance_tenant_integrity();
CREATE TRIGGER hv_order_governance_tenant_guard
BEFORE INSERT OR UPDATE OF "tenantId", "departmentId", "procurementApprovalPolicyId" ON "Order"
FOR EACH ROW EXECUTE FUNCTION hv_assert_governance_tenant_integrity();
