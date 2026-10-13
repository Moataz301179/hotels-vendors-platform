import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const CreditNoteSchema = z.object({
  grnId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
  invoiceId: z.string().min(1).optional(),
});

/**
 * Create a credit note linked to a Goods Receipt Note.
 * Used when received goods don't match the order (shortage, damage, overage).
 */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:write");

  const body = await request.json();
  const data = CreditNoteSchema.parse(body);

  const grn = await prisma.goodsReceiptNote.findUnique({ where: { id: data.grnId, tenantId: auth.tenantId } });
  if (!grn) return error("GRN not found", 404);
  if (grn.tenantId !== auth.tenantId) return error("GRN not found", 404);

  const invoice = await prisma.invoice.findFirst({ where: { tenantId: auth.tenantId, orderId: grn.orderId, ...(data.invoiceId ? { id: data.invoiceId } : {}) } });
  if (!invoice) return error("Invoice for this GRN not found", 404);
  if (data.amount > Number(invoice.total)) return error("Credit amount exceeds invoice total", 400);
  const creditNoteId = randomUUID();
  const creditNote = await prisma.$transaction(async (tx) => {
    const note = await tx.creditNote.create({
    data: {
      id: creditNoteId,
      number: `CN-${creditNoteId}`,
      tenantId: auth.tenantId,
      invoiceId: invoice.id,
      currency: invoice.currency,
      amount: data.amount,
      reason: data.reason ?? "Goods received discrepancy",
    },
    });
    await tx.auditLog.create({ data: { tenantId: auth.tenantId, actorId: auth.userId, entityName: "CREDIT_NOTE", entityId: note.id, actionType: "CREATE", changes: { grnId: grn.id, invoiceId: invoice.id, amount: data.amount, reason: data.reason ?? "Goods received discrepancy" } } });
    return note;
  });

  return success({
    id: creditNote.id,
    grnId: grn.id,
    invoiceId: creditNote.invoiceId,
    amount: Number(creditNote.amount),
    reason: creditNote.reason,
    status: creditNote.status,
    createdAt: creditNote.createdAt.toISOString(),
  });
});
