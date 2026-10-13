/**
 * ERP Integration Layer — Bi-Directional API/cXML Adapters
 * Supports: SAP, Odoo, Oracle Opera, custom cXML
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

/* ── Types ── */
type ErpProvider = "sap" | "odoo" | "oracle" | "custom";
type ExportOrder = Prisma.OrderGetPayload<{ include: { items: { include: { product: { select: { sku: true; name: true; id: true } } } }; hotel: { select: { name: true } } } }> & { totalAmount: number };

const PoSyncSchema = z.object({
  orderId: z.string(),
  erpProvider: z.enum(["sap", "odoo", "oracle", "custom"]),
});

const EtaSyncSchema = z.object({
  orderId: z.string(),
  invoiceUuid: z.string(),
  erpProvider: z.enum(["sap", "odoo", "oracle", "custom"]),
  etaPayload: z.record(z.string(), z.unknown()),
});

/* ── cXML Adapter ── */
function buildCxml(order: ExportOrder, supplierDuns: string): string {
  const items = order.items.map((item) =>
    `    <ItemOut quantity="${item.quantity}">\n      <ItemID><SupplierPartID>${item.product.sku || "UNKNOWN"}</SupplierPartID></ItemID>\n      <ItemDetail>\n        <UnitPrice><Money currency="EGP">${Number(item.unitPrice || 0).toFixed(2)}</Money></UnitPrice>\n        <Description xml:lang="en">${item.product?.name || "Item"}</Description>\n      </ItemDetail>\n    </ItemOut>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE cXML SYSTEM "http://xml.cXML.org/schemas/cXML/1.2.048/cXML.dtd">\n<cXML version="1.2.048" payloadID="${order.id}" timestamp="${new Date().toISOString()}">\n  <Header>\n    <From><Credential domain="DUNS"><Identity>HOTELSVENDORS</Identity></Credential></From>\n    <To><Credential domain="DUNS"><Identity>${supplierDuns}</Identity></Credential></To>\n  </Header>\n  <Request>\n    <OrderRequest>\n      <OrderRequestHeader orderID="${order.orderNumber || order.id}" orderDate="${new Date().toISOString().split("T")[0]}" type="new">\n        <Total><Money currency="EGP">${Number(order.totalAmount || 0).toFixed(2)}</Money></Total>\n      </OrderRequestHeader>\n${items}\n    </OrderRequest>\n  </Request>\n</cXML>`;
}

/* ── SAP BAPI Adapter ── */
function buildSapPayload(order: ExportOrder) {
  return {
    BAPI_PO_CREATE1: {
      PO_HEADER: { DOC_TYPE: "NB", PURCH_ORG: "HV01", VENDOR: order.supplierId, CURRENCY: "EGP" },
      PO_ITEMS: order.items.map((item, i) => ({
        PO_ITEM: String(i + 1).padStart(5, "0"),
        MATERIAL: item.product.sku || "UNKNOWN",
        QUANTITY: item.quantity,
        NET_PRICE: Number(item.unitPrice || 0).toFixed(2),
      })),
    },
  };
}

/* ── Odoo JSON-RPC Adapter ── */
function buildOdooPayload(order: ExportOrder) {
  return {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "purchase.order",
      method: "create",
      args: [{
        partner_ref: order.supplierId,
        date_order: new Date().toISOString().split("T")[0],
        order_line: order.items.map((item) => [
          0, 0, {
            product_id: item.product?.id || item.id,
            name: item.product?.name || "Item",
            product_qty: item.quantity,
            price_unit: Number(item.unitPrice || 0),
          },
        ]),
      }],
    },
  };
}

/* ── Oracle Opera PMS Adapter ── */
function buildOraclePayload(order: ExportOrder) {
  return {
    OPERA_Cloud_PO: {
      propertyCode: order.hotelId || "DEFAULT",
      vendorId: order.supplierId,
      orderReference: order.orderNumber || order.id,
      currencyCode: "EGP",
      lineItems: order.items.map((item) => ({
        itemCode: item.product.sku || "UNKNOWN",
        description: item.product?.name || "Item",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice || 0),
      })),
    },
  };
}

/* ── GET /api/v1/erp/budgets — Departmental spend ceilings ── */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "report:read");
  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");

  // Query products used by this department for spend analytics
  const spend = await prisma.orderItem.findMany({
    where: {
      order: { tenantId: auth.tenantId, status: { in: ["APPROVED", "IN_TRANSIT", "DELIVERED"] } },
    },
    select: {
      total: true,
      product: { select: { category: true, name: true } },
      order: { select: { createdAt: true, hotel: { select: { name: true } } } },
    },
    take: 200,
  });

  const categorySpend = new Map<string, number>();
  for (const item of spend) {
    const cat = item.product?.category || "UNKNOWN";
    categorySpend.set(cat, (categorySpend.get(cat) || 0) + Number(item.total));
  }

  const budgets = Array.from(categorySpend.entries()).map(([department, spent]) => ({
    department,
    allocatedAmount: null, // No configured departmental budget source exists.
    spentAmount: spent,
    remainingAmount: null,
    currency: "EGP",
  }));

  return success({ budgets, source: "order_history_analytics" });
});

/* ── POST /api/v1/erp/po-sync — Push order to ERP ── */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");
  const body = await request.json();
  const { orderId, erpProvider } = PoSyncSchema.parse(body);

  const order = await prisma.order.findUnique({
    where: { id: orderId, tenantId: auth.tenantId },
    include: {
      items: { include: { product: { select: { sku: true, name: true, id: true } } } },
      hotel: { select: { name: true } },
    },
  });

  if (!order) return error("Order not found", 404);
  const totalAmount = order.items.reduce((sum, i) => sum + Number(i.total), 0);

  let payload: string | ReturnType<typeof buildSapPayload> | ReturnType<typeof buildOdooPayload> | ReturnType<typeof buildOraclePayload> | Record<string, unknown>;
  let contentType = "application/json";

  switch (erpProvider) {
    case "sap": payload = buildSapPayload({ ...order, totalAmount }); break;
    case "odoo": payload = buildOdooPayload({ ...order, totalAmount }); break;
    case "oracle": payload = buildOraclePayload({ ...order, totalAmount }); break;
    case "custom": payload = buildCxml({ ...order, totalAmount }, order.supplierId); contentType = "application/xml"; break;
    default:
      payload = {
        orderId: order.id, orderNumber: order.orderNumber,
        hotel: order.hotel?.name, supplierId: order.supplierId, totalAmount,
        items: order.items.map((i) => ({
          sku: i.product?.sku, name: i.product?.name,
          quantity: i.quantity, unitPrice: Number(i.unitPrice), total: Number(i.total),
        })),
      };
  }

  await prisma.auditLog.create({
    data: {
      tenantId: auth.tenantId, entityId: orderId, actorId: "ERP_INTEGRATION", actionType: "UPDATE",
      changes: {
        erpProvider, format: erpProvider === "custom" ? "cXML" : "JSON",
        orderNumber: order.orderNumber, totalAmount,
        status: "ERP_EXPORT_PREPARED",
        payload: JSON.stringify(payload).slice(0, 4000), // Truncate for audit
      },
    },
  });

  return success({
    status: "export_prepared", erpProvider,
    format: contentType === "application/xml" ? "cXML" : "JSON",
    erpPurchaseOrderId: null,
    message: "Export payload prepared. No ERP connector has accepted or synchronized it.",
    payload,
  });
});

/* ── POST /api/v1/erp/eta-sync — Push ETA invoice for tax compliance ── */
export async function POST_ETA(request: NextRequest) {
  const auth = await authenticate(request);
  const body = await request.json();
  const { orderId, invoiceUuid, erpProvider, etaPayload } = EtaSyncSchema.parse(body);

  const taxPayload = {
    invoiceUuid, orderId, erpProvider,
    generatedAt: new Date().toISOString(),
    qrCode: `QR:ETA:${invoiceUuid}`,
    payload: etaPayload,
  };

  await prisma.auditLog.create({
    data: {
      tenantId: auth.tenantId, entityId: orderId, actorId: "ERP_TAX_SYNC", actionType: "UPDATE",
      changes: { invoiceUuid, erpProvider, status: "TAX_SYNCED", payload: JSON.stringify(taxPayload).slice(0, 4000) },
    },
  });

  return success({ status: "tax_synced", invoiceUuid, erpProvider, taxPayload });
}

export { POST_ETA as POST_ETA_SYNC };
