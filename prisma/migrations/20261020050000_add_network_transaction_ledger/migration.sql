-- Durable, tenant-bound transaction evidence for the procurement lifecycle.
-- Do not apply to production until the documented Neon recovery clone and
-- migration approval gate are complete.

CREATE TYPE "NetworkTransactionStatus" AS ENUM ('OPEN', 'COMPLETED', 'ARCHIVED', 'VOIDED');

CREATE TABLE "NetworkTransaction" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "rootRfqId" TEXT,
  "orderId" TEXT,
  "invoiceId" TEXT,
  "status" "NetworkTransactionStatus" NOT NULL DEFAULT 'OPEN',
  "retentionClass" TEXT NOT NULL DEFAULT 'PROCUREMENT_TRANSACTION',
  "retentionUntil" TIMESTAMP(3),
  "finalizedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "archiveManifestHash" TEXT,
  "latestEventHash" TEXT,
  "eventCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "uuid" UUID DEFAULT gen_random_uuid(),
  CONSTRAINT "NetworkTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NetworkTransactionEvent" (
  "id" TEXT NOT NULL,
  "networkTransactionId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sourceEntityName" "EntityName",
  "sourceEntityId" TEXT NOT NULL,
  "eventType" "ActionType",
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorId" TEXT,
  "actorRole" TEXT,
  "verificationMethod" TEXT,
  "documentHash" TEXT,
  "payload" JSONB,
  "payloadHash" TEXT NOT NULL,
  "previousHash" TEXT NOT NULL,
  "hash" TEXT NOT NULL,
  "supersedesEventId" TEXT,
  "auditLogId" TEXT,
  "uuid" UUID DEFAULT gen_random_uuid(),
  CONSTRAINT "NetworkTransactionEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NetworkTransaction_rootRfqId_key" ON "NetworkTransaction"("rootRfqId");
CREATE UNIQUE INDEX "NetworkTransaction_orderId_key" ON "NetworkTransaction"("orderId");
CREATE UNIQUE INDEX "NetworkTransaction_invoiceId_key" ON "NetworkTransaction"("invoiceId");
CREATE UNIQUE INDEX "NetworkTransaction_uuid_key" ON "NetworkTransaction"("uuid");
CREATE UNIQUE INDEX "NetworkTransactionEvent_auditLogId_key" ON "NetworkTransactionEvent"("auditLogId");
CREATE UNIQUE INDEX "NetworkTransactionEvent_uuid_key" ON "NetworkTransactionEvent"("uuid");
CREATE INDEX "NetworkTransaction_tenantId_status_createdAt_idx" ON "NetworkTransaction"("tenantId", "status", "createdAt");
CREATE INDEX "NetworkTransaction_tenantId_archivedAt_idx" ON "NetworkTransaction"("tenantId", "archivedAt");
CREATE INDEX "NetworkTransactionEvent_networkTransactionId_recordedAt_idx" ON "NetworkTransactionEvent"("networkTransactionId", "recordedAt");
CREATE INDEX "NetworkTransactionEvent_tenantId_occurredAt_idx" ON "NetworkTransactionEvent"("tenantId", "occurredAt");
CREATE INDEX "NetworkTransactionEvent_sourceEntityName_sourceEntityId_idx" ON "NetworkTransactionEvent"("sourceEntityName", "sourceEntityId");

ALTER TABLE "NetworkTransaction" ADD CONSTRAINT "NetworkTransaction_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NetworkTransactionEvent" ADD CONSTRAINT "NetworkTransactionEvent_networkTransactionId_fkey"
  FOREIGN KEY ("networkTransactionId") REFERENCES "NetworkTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NetworkTransactionEvent" ADD CONSTRAINT "NetworkTransactionEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NetworkTransactionEvent" ADD CONSTRAINT "NetworkTransactionEvent_auditLogId_fkey"
  FOREIGN KEY ("auditLogId") REFERENCES "AuditLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NetworkTransactionEvent" ADD CONSTRAINT "NetworkTransactionEvent_supersedesEventId_fkey"
  FOREIGN KEY ("supersedesEventId") REFERENCES "NetworkTransactionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION hv_reject_network_transaction_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'NetworkTransactionEvent is append-only: % is forbidden', TG_OP;
END;
$$;
CREATE TRIGGER hv_network_transaction_event_immutable
BEFORE UPDATE OR DELETE ON "NetworkTransactionEvent"
FOR EACH ROW EXECUTE FUNCTION hv_reject_network_transaction_event_mutation();
