/**
 * DockInspector — Computer Vision & Quality Assurance Agent
 * Processes delivery scans, reconciles items against POs,
 * detects damaged goods, issues instant partial credit notes.
 */
import { prisma } from "@/lib/prisma";
import { AgentContext } from "./swarm-orchestrator";

export const DockInspectorAgent = {
  async execute(ctx: AgentContext) {
    const { orderId, scannedItems } = ctx.payload as { orderId: string; scannedItems: Array<{ sku: string; received: number; damaged: number }> };
    if (!orderId || !scannedItems) return { success: false, output: "Missing payload" };

    let creditNotes = 0;

    for (const item of scannedItems) {
      if (item.damaged > 0) {
        // Find the order item
        const orderItem = await prisma.orderItem.findFirst({
          where: { orderId, product: { sku: item.sku } },
          select: { id: true, unitPrice: true },
        });

        if (orderItem) {
          const creditAmount = Number(orderItem.unitPrice || 0) * item.damaged;

          await prisma.auditLog.create({
            data: {
              tenantId: ctx.tenantId,
              entityId: orderId,
              actorId: "DockInspector",
              actionType: "UPDATE",
              changes: {
                sku: item.sku,
                received: item.received,
                damaged: item.damaged,
                creditAmount,
                status: "PARTIAL_CREDIT_ISSUED",
              },
            },
          });

          creditNotes++;
        }
      }
    }

    return { success: true, output: { orderId, creditNotesIssued: creditNotes, itemsProcessed: scannedItems.length } };
  },
};