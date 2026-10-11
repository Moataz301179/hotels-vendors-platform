ALTER TABLE "DepartmentCategoryAccess" ADD COLUMN "revokedAt" TIMESTAMP(3);
ALTER TABLE "DepartmentCategoryAccess" ADD COLUMN "revokedById" TEXT;
CREATE INDEX "DepartmentCategoryAccess_departmentId_revokedAt_idx" ON "DepartmentCategoryAccess"("departmentId", "revokedAt");
