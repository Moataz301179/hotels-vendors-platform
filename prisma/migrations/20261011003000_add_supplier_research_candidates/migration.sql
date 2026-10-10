-- Public-source supplier intake is deliberately separate from transacting Supplier records.
CREATE TABLE "SupplierResearchCandidate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "candidateType" TEXT NOT NULL,
  "website" TEXT,
  "sourceUrl" TEXT NOT NULL,
  "sourceObservedAt" TIMESTAMP(3) NOT NULL,
  "categories" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RESEARCH_CANDIDATE',
  "sourceHash" TEXT NOT NULL,
  "verificationNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "SupplierResearchCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierResearchCandidate_sourceHash_key"
  ON "SupplierResearchCandidate"("sourceHash");
CREATE INDEX "SupplierResearchCandidate_candidateType_idx"
  ON "SupplierResearchCandidate"("candidateType");
CREATE INDEX "SupplierResearchCandidate_status_idx"
  ON "SupplierResearchCandidate"("status");
CREATE INDEX "SupplierResearchCandidate_deletedAt_idx"
  ON "SupplierResearchCandidate"("deletedAt");
