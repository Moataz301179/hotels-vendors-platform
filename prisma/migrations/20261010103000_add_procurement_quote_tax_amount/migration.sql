-- Local development artifact only. Do not apply until the release migration plan is approved.
ALTER TABLE "ProcurementQuote"
ADD COLUMN "taxAmount" DECIMAL(12,2);
