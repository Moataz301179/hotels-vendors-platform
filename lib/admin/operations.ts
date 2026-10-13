import { prisma } from "@/lib/prisma";
import type { z } from "zod";
import type { operationsQuery, operationsSection, OperationsResult } from "./operations-contract";

export async function listOperations(section: z.infer<typeof operationsSection>, query: z.infer<typeof operationsQuery>): Promise<OperationsResult> {
  const { search, page, limit } = query;
  const pagination = { take: limit, skip: (page - 1) * limit, orderBy: { createdAt: "desc" as const } };
  const contains = { contains: search, mode: "insensitive" as const };
  let rows: OperationsResult["rows"] = [];
  let total = 0;
  let columns: OperationsResult["columns"] = [];
  const fields = (entries: [string, string][]) => entries.map(([key, label]) => ({ key, label }));
  if (section === "procurement") {
    const where = { deletedAt: null, tenant: { deletedAt: null }, ...(search ? { orderNumber: contains } : {}) };
    const [records, count] = await Promise.all([prisma.order.findMany({ ...pagination, where, select: { id: true, orderNumber: true, tenantId: true, status: true, total: true, paymentGuaranteed: true, createdAt: true } }), prisma.order.count({ where })]);
    rows = records.map(row => ({ ...row, total: row.total?.toString() ?? null, createdAt: row.createdAt.toISOString() })); total = count;
    columns = fields([["orderNumber", "Order"], ["tenantId", "Organization ID"], ["status", "Status"], ["total", "Recorded total"], ["paymentGuaranteed", "Guarantee recorded"], ["createdAt", "Created"]]);
  } else if (section === "catalog") {
    const where = { deletedAt: null, tenant: { deletedAt: null }, source: { not: "FIXTURE" as const }, ...(search ? { OR: [{ name: contains }, { sku: contains }] } : {}) };
    const [records, count] = await Promise.all([prisma.product.findMany({ ...pagination, where, select: { id: true, name: true, sku: true, status: true, currency: true, unitPrice: true, stockQuantity: true, pricingMode: true, source: true } }), prisma.product.count({ where })]);
    rows = records.map(row => ({ ...row, unitPrice: row.unitPrice?.toString() ?? null })); total = count;
    columns = fields([["name", "Product"], ["sku", "SKU"], ["status", "Status"], ["unitPrice", "Unit price"], ["currency", "Currency"], ["stockQuantity", "Available quantity"], ["pricingMode", "Pricing"], ["source", "Provenance"]]);
  } else if (section === "verification") {
    const where = { deletedAt: null, tenant: { deletedAt: null }, ...(search ? { name: contains } : {}) };
    const [records, count] = await Promise.all([prisma.supplier.findMany({ ...pagination, where, select: { id: true, name: true, tenantId: true, city: true, status: true, isVerified: true, updatedAt: true } }), prisma.supplier.count({ where })]);
    rows = records.map(row => ({ ...row, updatedAt: row.updatedAt.toISOString() })); total = count;
    columns = fields([["name", "Business"], ["tenantId", "Organization ID"], ["city", "City"], ["status", "Status"], ["isVerified", "Verified"], ["updatedAt", "Updated"]]);
  } else if (section === "documents") {
    const where = { deletedAt: null, tenant: { deletedAt: null }, ...(search ? { entityId: contains } : {}) };
    const [records, count] = await Promise.all([prisma.document.findMany({ ...pagination, where, select: { id: true, tenantId: true, entityType: true, entityId: true, category: true, createdAt: true } }), prisma.document.count({ where })]);
    rows = records.map(row => ({ ...row, createdAt: row.createdAt.toISOString() })); total = count;
    columns = fields([["id", "Evidence ID"], ["tenantId", "Organization ID"], ["entityType", "Record type"], ["entityId", "Owner record ID"], ["category", "Category"], ["createdAt", "Uploaded"]]);
  } else if (section === "logistics") {
    const where = { deletedAt: null, ...(search ? { corridor: contains } : {}) };
    const [records, count] = await Promise.all([prisma.shipment.findMany({ ...pagination, where, select: { id: true, tenantId: true, corridor: true, status: true, originHub: true, destinationHub: true, orderCount: true, dispatchDate: true, estimatedArrival: true } }), prisma.shipment.count({ where })]);
    rows = records.map(row => ({ ...row, dispatchDate: row.dispatchDate?.toISOString() ?? null, estimatedArrival: row.estimatedArrival?.toISOString() ?? null })); total = count;
    columns = fields([["corridor", "Corridor"], ["status", "Status"], ["originHub", "Origin"], ["destinationHub", "Destination"], ["orderCount", "Orders"], ["dispatchDate", "Dispatch"], ["estimatedArrival", "Expected arrival"]]);
  } else if (section === "returns") {
    const where = { Order: { deletedAt: null, tenant: { deletedAt: null } }, ...(search ? { orderId: contains } : {}) };
    const [records, count] = await Promise.all([prisma.returnRequest.findMany({ ...pagination, where, select: { id: true, tenantId: true, orderId: true, status: true, reason: true, requestedQty: true, approvedQty: true, amount: true, createdAt: true } }), prisma.returnRequest.count({ where })]);
    rows = records.map(row => ({ ...row, amount: row.amount.toString(), createdAt: row.createdAt.toISOString() })); total = count;
    columns = fields([["orderId", "Order ID"], ["status", "Status"], ["reason", "Reason"], ["requestedQty", "Requested quantity"], ["approvedQty", "Approved quantity"], ["amount", "Recorded amount"], ["createdAt", "Created"]]);
  } else if (section === "finance") {
    const where = { deletedAt: null, tenant: { deletedAt: null }, ...(search ? { invoiceNumber: contains } : {}) };
    const [records, count] = await Promise.all([prisma.invoice.findMany({ ...pagination, where, select: { id: true, invoiceNumber: true, tenantId: true, currency: true, total: true, platformFee: true, status: true, paymentStatus: true, dueDate: true } }), prisma.invoice.count({ where })]);
    rows = records.map(row => ({ ...row, total: row.total?.toString() ?? null, platformFee: row.platformFee.toString(), dueDate: row.dueDate?.toISOString() ?? null })); total = count;
    columns = fields([["invoiceNumber", "Invoice"], ["currency", "Currency"], ["total", "Recorded total"], ["platformFee", "Recorded platform fee"], ["status", "Invoice status"], ["paymentStatus", "Payment status"], ["dueDate", "Due date"]]);
  } else if (section === "automation") {
    const where = { deletedAt: null, tenant: { deletedAt: null }, ...(search ? { jobName: contains } : {}) };
    const [records, count] = await Promise.all([prisma.swarmJob.findMany({ ...pagination, where, select: { id: true, tenantId: true, jobName: true, queueName: true, status: true, assignedAgent: true, attempt: true, maxAttempts: true, requiresApproval: true, scheduledAt: true } }), prisma.swarmJob.count({ where })]);
    rows = records.map(row => ({ ...row, scheduledAt: row.scheduledAt?.toISOString() ?? null })); total = count;
    columns = fields([["jobName", "Job"], ["queueName", "Queue"], ["status", "Recorded status"], ["assignedAgent", "Agent"], ["attempt", "Attempts"], ["maxAttempts", "Maximum attempts"], ["requiresApproval", "Approval required"], ["scheduledAt", "Scheduled"]]);
  } else {
    const where = { deletedAt: null, tenant: { deletedAt: null }, ...(search ? { invoiceNumber: contains } : {}) };
    const [records, count] = await Promise.all([prisma.etaDeadLetterJob.findMany({ ...pagination, where, select: { id: true, tenantId: true, invoiceNumber: true, status: true, attemptCount: true, maxAttempts: true, nextRetryAt: true } }), prisma.etaDeadLetterJob.count({ where })]);
    rows = records.map(row => ({ ...row, nextRetryAt: row.nextRetryAt.toISOString() })); total = count;
    columns = fields([["invoiceNumber", "Invoice"], ["status", "Recovery status"], ["attemptCount", "Attempts"], ["maxAttempts", "Maximum attempts"], ["nextRetryAt", "Next retry"]]);
  }
  return { section, columns, rows, scope: "platform", generatedAt: new Date().toISOString(), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
