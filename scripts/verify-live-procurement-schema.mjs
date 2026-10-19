import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

/**
 * Read-only compatibility gate for the production procurement path.
 *
 * CI builds against an isolated PostgreSQL database. That is necessary, but
 * insufficient proof that the separately managed production database exposes
 * the columns the release will query. This script deliberately performs no
 * migration and no data write: it verifies only the relations and columns
 * used by the reviewed directory and authenticated RFQ -> quote -> PO ->
 * approval -> GRN paths.
 */
const requiredSchema = {
  Tenant: ["id", "status", "verificationStatus", "taxId", "deletedAt"],
  User: ["id", "email", "status", "platformRole", "tenantId", "supplierId", "departmentId", "deletedAt"],
  Hotel: ["id", "tenantId", "status", "taxId", "deletedAt"],
  Supplier: ["id", "tenantId", "status", "isVerified", "taxId", "deletedAt"],
  Product: ["id", "tenantId", "supplierId", "status", "sku", "images", "deletedAt"],
  DirectorySource: ["id", "sourceUrl", "permissionStatus", "observedAt", "refreshStatus", "deletedAt"],
  DirectoryCandidate: ["id", "sourceId", "sourceFingerprint", "searchText", "itemType", "category", "sourceSnapshot", "reviewStatus", "deletedAt"],
  DirectoryProfile: ["id", "candidateId", "searchText", "itemType", "category", "images", "publicationStatus", "deletedAt"],
  RfqRequest: ["id", "buyerId", "productId", "supplierId", "itemName", "unitOfMeasure", "deliveryLocation", "packDescription", "matchingStatus", "requestedQty", "status", "tenantId", "deletedAt"],
  RfqSupplierAccess: ["id", "rfqId", "supplierId", "hotelTenantId", "supplierTenantId", "revokedAt"],
  ProcurementQuote: ["id", "rfqId", "tenantId", "supplierId", "unitPrice", "quantity", "deliveryFee", "taxAmount", "status", "deletedAt"],
  Order: ["id", "orderNumber", "tenantId", "hotelId", "supplierId", "status", "paymentGuaranteed", "approvalPolicySnapshot", "estimatedDelivery", "deletedAt"],
  OrderItem: ["id", "orderId", "productId", "quantity", "receivedQuantity", "deletedAt"],
  OrderApproval: ["id", "orderId", "approverId", "action", "deletedAt"],
  GoodsReceiptNote: ["id", "orderId", "tenantId", "status", "receivedById", "deletedAt"],
  GrnLineItem: ["id", "grnId", "orderItemId", "receivedQuantity", "acceptedQuantity"],
  PhysicalInventoryCount: ["id", "tenantId", "hotelId", "productId", "countedById", "clientSubmissionId", "observedQuantity", "capturedAt", "status", "deletedAt"],
  AuditLog: ["id", "tenantId", "entityId", "actionType", "actorId"],
  NetworkTransaction: ["id", "tenantId", "rootRfqId", "orderId", "invoiceId", "status", "retentionClass", "latestEventHash", "eventCount"],
  NetworkTransactionEvent: ["id", "networkTransactionId", "tenantId", "sourceEntityId", "occurredAt", "payloadHash", "previousHash", "hash", "auditLogId"],
};

async function loadDatabaseUrlFromEnvFile() {
  for (const name of [".runtime-env", ".env"]) {
    try {
      const source = await readFile(resolve(process.cwd(), name), "utf8");
      const line = source.split(/\r?\n/).find((candidate) => candidate.startsWith("DATABASE_URL="));
      if (!line) continue;
      const raw = line.slice("DATABASE_URL=".length).trim();
      if (!raw) continue;
      return (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") continue;
      throw error;
    }
  }
  return undefined;
}

const databaseUrl = process.env.DATABASE_URL || await loadDatabaseUrlFromEnvFile();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for the read-only procurement schema gate.");
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  const result = await client.query(
    `select table_name, column_name
       from information_schema.columns
      where table_schema = 'public'
        and table_name = any($1::text[])`,
    [Object.keys(requiredSchema)],
  );
  const observed = new Map();
  for (const row of result.rows) {
    if (!observed.has(row.table_name)) observed.set(row.table_name, new Set());
    observed.get(row.table_name).add(row.column_name);
  }
  const missing = Object.entries(requiredSchema).flatMap(([table, columns]) => {
    const actual = observed.get(table);
    if (!actual) return [`${table} (table missing)`];
    return columns.filter((column) => !actual.has(column)).map((column) => `${table}.${column}`);
  });
  if (missing.length) {
    throw new Error(`Production procurement schema is incompatible with this release: ${missing.join(", ")}`);
  }
  console.log(JSON.stringify({ ok: true, checkedTables: Object.keys(requiredSchema).length, mode: "read-only" }));
} finally {
  await client.end().catch(() => undefined);
}
