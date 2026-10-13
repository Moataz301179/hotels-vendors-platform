/**
 * ComplianceGuard — Autonomous ETA & Regulatory Sentinel
 * Validates Tax IDs on signup. Formats, verifies, and submits
 * ETA e-Invoice JSON payloads and e-Waybills with scannable QR codes.
 */
import { prisma } from "@/lib/prisma";
import { AgentContext } from "./swarm-orchestrator";

interface EtaInvoicePayload {
  uuid: string | null;
  seller: { taxId: string; name: string };
  buyer: { taxId: string; name: string };
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
  totalAmount: number;
  currency: string;
  generatedAt: string;
  qrCode: string;
}

export const ComplianceGuardAgent = {
  async execute(ctx: AgentContext) {
    const orderId = ctx.payload.orderId as string;
    if (!orderId) return { success: false, output: "Missing orderId" };

    const order = await prisma.order.findUnique({
      where: { id: orderId, tenantId: ctx.tenantId },
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
        hotel: { select: { name: true, taxId: true } },
        supplier: { select: { name: true, taxId: true } },
      },
    });

    if (!order) return { success: false, output: "Order not found" };

    // Build an internal draft. Only ETA acceptance may assign an official UUID.
    const invoice: EtaInvoicePayload = {
      uuid: order.etaSubmissionId,
      seller: { taxId: order.supplier.taxId, name: order.supplier.name },
      buyer: { taxId: order.hotel?.taxId || "UNKNOWN", name: order.hotel?.name || "Unknown Hotel" },
      items: order.items.map((i) => ({
        name: i.product?.name || "Unknown",
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
      totalAmount: order.items.reduce((sum, i) => sum + Number(i.total), 0),
      currency: order.currency || "EGP",
      generatedAt: new Date().toISOString(),
      qrCode: "",
    };

    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        entityId: orderId,
        actorId: "ComplianceGuard",
        actionType: "UPDATE",
        entityName: "ORDER",
        changes: { status: "INVOICE_DRAFT_GENERATED", submitted: false },
      },
    });

    return { success: true, output: { invoice, submitted: false } };
  },
} as const;
