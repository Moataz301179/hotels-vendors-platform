/**
 * ETA e-Waybill Generator — Tax Compliance & QR Code for Transport
 * HotelsVendors Logistics Module
 *
 * Creates an unsigned internal transport draft. This is not an ETA document,
 * a digital signature, or proof accepted at transport checkpoints.
 */
import { prisma } from "@/lib/prisma";
import { linkProcurementAudit } from "../audit/procurement-audit-link";

interface EtaWaybillItem {
  itemCode: string;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  hsnCode: string;
}

interface EtaWaybillPayload {
  version: string;
  waybillId: string;
  transporterId: string;
  supplierGstin: string;
  buyerGstin: string;
  vehicleNumber: string;
  driverName: string;
  driverMobile: string;
  originCity: string;
  destinationCity: string;
  dispatchDate: string;
  estimatedArrival: string;
  items: EtaWaybillItem[];
  totalValue: number;
  totalQuantity: number;
  qrCode: string;
  qrSignature: string;
  generatedAt: string;
  complianceStatus: "UNSIGNED_INTERNAL_DRAFT";
}

const HSN_CODES: Record<string, string> = {
  LINEN: "530900", BATHROOM: "960500", KITCHEN: "732100", HVAC: "841500",
  FURNITURE: "940300", CLEANING: "340200", FOOD: "190200", BEVERAGE: "220200",
  BEDDING: "630200", POOL_SPA: "950600", DEFAULT: "630900",
};

export async function generateEtaWaybill(
  orderId: string,
  vehicleNumber: string,
  driverName: string,
  driverMobile: string,
  originCity: string,
  destinationCity: string,
  transporterId: string,
  tenantId: string
): Promise<{ success: boolean; waybill?: EtaWaybillPayload }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId, tenantId },
    include: {
      items: { include: { product: { select: { name: true, sku: true, category: true } } } },
      supplier: { select: { taxId: true } },
      hotel: { select: { taxId: true } },
    },
  });

  if (!order) return { success: false };

  const waybillId = `EWB-${Date.now().toString(36).toUpperCase()}`;
  const items = order.items.map((item) => ({
    itemCode: item.product?.sku || "UNKNOWN",
    description: item.product?.name || "Item",
    quantity: item.quantity,
    unitValue: Number(item.unitPrice),
    totalValue: Number(item.total),
    hsnCode: HSN_CODES[item.product?.category || "DEFAULT"] || HSN_CODES.DEFAULT,
  }));

  const totalValue = items.reduce((sum, i) => sum + i.totalValue, 0);
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  const waybill: EtaWaybillPayload = {
    version: "1.1",
    waybillId,
    transporterId,
    supplierGstin: order.supplier.taxId, // Legacy field name; value is Egyptian seller tax ID.
    buyerGstin: order.hotel.taxId, // Legacy field name; value is Egyptian buyer tax ID.
    vehicleNumber,
    driverName,
    driverMobile,
    originCity,
    destinationCity,
    dispatchDate: new Date().toISOString().split("T")[0],
    estimatedArrival: new Date(Date.now() + 48 * 3600000).toISOString().split("T")[0],
    items,
    totalValue,
    totalQuantity,
    qrCode: `QR:EWB:${waybillId}:${vehicleNumber}`,
    qrSignature: "", // No digital signature exists for this internal draft.
    generatedAt: new Date().toISOString(),
    complianceStatus: "UNSIGNED_INTERNAL_DRAFT",
  };

  const auditResult = await prisma.auditLog.create({
    data: {
      tenantId, entityId: orderId, actorId: "ETA_WAYBILL_GENERATOR", actionType: "UPDATE",
      changes: {
        waybillId,
        vehicleNumber,
        driverName,
        originCity,
        destinationCity,
        totalValue,
        totalQuantity,
        qrCode: waybill.qrCode,
        status: "INTERNAL_TRANSPORT_DRAFT_GENERATED",
      },
    },
  });
  await linkProcurementAudit(auditResult.id, "INFERRED", "shipping-eta-waybill", { orderId: orderId }).catch((err) => console.error("Audit provenance link failed:", err));

  return { success: true, waybill };
}

/* ── HSN code lookup ── */
export function getHsnCode(category: string): string {
  return HSN_CODES[category] || HSN_CODES.DEFAULT;
}
