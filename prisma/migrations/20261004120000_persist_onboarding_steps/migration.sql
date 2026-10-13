CREATE TABLE "OnboardingStepProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "stepKey" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "data" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "OnboardingStepProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnboardingStepProgress_userId_stepKey_key"
  ON "OnboardingStepProgress"("userId", "stepKey");
CREATE INDEX "OnboardingStepProgress_tenantId_completed_idx"
  ON "OnboardingStepProgress"("tenantId", "completed");
CREATE INDEX "OnboardingStepProgress_deletedAt_idx"
  ON "OnboardingStepProgress"("deletedAt");

ALTER TABLE "OnboardingStepProgress"
  ADD CONSTRAINT "OnboardingStepProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnboardingStepProgress"
  ADD CONSTRAINT "OnboardingStepProgress_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
