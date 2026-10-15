import { Client } from "pg";

/**
 * Read-only compatibility gate for the production procurement path.
 *
 * CI builds against an isolated PostgreSQL database. That is necessary, but
 * insufficient proof that the separately managed production database exposes
 * the columns the release will query. This script deliberately performs no
 * migration and no data write: it verifies only the relations and columns
 * used by the authenticated RFQ -> quote -> PO -> approval -> GRN path.
 */
const requiredSchema = {
  Tenant: ["id", "status", "verificationStatus", "taxId", "deletedAt"],
  User: ["id", "email", "status", "platformRole", "tenantId", "supplierId", "departmentId", "deletedAt"],
  Hotel: ["id", "tenantId", "status", "taxId", "deletedAt"],
  Supplier: ["id", "tenantId", "status", "isVerified", "taxId", "deletedAt"],
  Product: ["id", "tenantId", "supplierId", "status", "sku", "images", "deletedAt"],
  RfqRequest: ["id", "buyerId", "productId", "supplierId", "requestedQty", "status", "tenantId", "deletedAt"],
  RfqSupplierAccess: ["id", "rfqId", "supplierId", "hotelTenantId", "supplierTenantId", "revokedAt"],
  ProcurementQuote: ["id", "rfqId", "tenantId", "supplierId", "unitPrice", "quantity", "deliveryFee", "taxAmount", "status", "deletedAt"],
  Order: ["id", "orderNumber", "tenantId", "hotelId", "supplierId", "status", "paymentGuaranteed", "approvalPolicySnapshot", "estimatedDelivery", "deletedAt"],
  OrderItem: ["id", "orderId", "productId", "quantity", "receivedQuantity", "deletedAt"],
  OrderApproval: ["id", "orderId", "approverId", "action", "deletedAt"],
  GoodsReceiptNote: ["id", "orderId", "tenantId", "status", "receivedById", "deletedAt"],
  GrnLineItem: ["id", "grnId", "orderItemId", "receivedQuantity", "acceptedQuantity"],
  AuditLog: ["id", "tenantId", "entityId", "actionType", "actorId"],
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the read-only procurement schema gate.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

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
