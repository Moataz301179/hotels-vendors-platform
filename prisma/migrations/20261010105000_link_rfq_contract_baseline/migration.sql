-- Local development artifact only. Do not apply until the release migration plan is approved.
ALTER TABLE "RfqRequest" ADD COLUMN "contractBaselineId" TEXT;
CREATE INDEX "RfqRequest_tenantId_contractBaselineId_idx" ON "RfqRequest"("tenantId", "contractBaselineId");
ALTER TABLE "RfqRequest" ADD CONSTRAINT "RfqRequest_contractBaselineId_fkey"
  FOREIGN KEY ("contractBaselineId") REFERENCES "ContractRateBaseline"("id") ON DELETE SET NULL ON UPDATE CASCADE;
