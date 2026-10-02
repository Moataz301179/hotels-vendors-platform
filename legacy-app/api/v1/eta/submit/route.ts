import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { etaClient } from "@/lib/eta/client";
import { validateForSubmission } from "@/lib/eta/validator";
import { apiRoute, authenticate, requirePermission, success, error, audit } from "@/lib/api-utils";
import { z } from "zod";

const SubmitSchema = z.object({
  invoiceId: z.string().cuid(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:submit_eta");
  const body = await request.json();
  const data = SubmitSchema.parse(body);

  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { hotel: true, supplier: true, order: { include: { items: { include: { product: true } } } } },
  });

  if (!invoice || invoice.tenantId !== auth.tenantId) {
    return error("Invoice not found", 404);
  }

  const validation = await validateForSubmission(data.invoiceId);
  if (!validation.valid) {
    return error(`ETA submission validation failed: ${validation.message}`, 422);
  }

  const payload = {
    issuer: {
      type: "B" as const,
      id: invoice.supplier.taxId,
      name: invoice.supplier.name,
      address: {
        country: "EG",
        governate: invoice.supplier.governorate,
        regionCity: invoice.supplier.city,
        street: invoice.supplier.address || "Unknown",
        buildingNumber: "1",
      },
    },
    receiver: {
      type: "B" as const,
      id: invoice.hotel.taxId,
      name: invoice.hotel.name,
      address: {
        country: "EG",
        governate: invoice.hotel.governorate,
        regionCity: invoice.hotel.city,
        street: invoice.hotel.address || "Unknown",
        buildingNumber: "1",
      },
    },
    documentType: "I" as const,
    documentTypeVersion: "1.0" as const,
    dateIssued: invoice.issueDate.toISOString(),
    internalId: invoice.invoiceNumber,
    purchaseOrderReference: invoice.order.orderNumber,
    payment: { terms: "Net 30" },
    delivery: { approach: "By Truck", terms: "DAP" },
    invoiceLines: invoice.order.items.map((item) => ({
      description: item.product.name,
      itemType: "EGS" as const,
      itemCode: item.product.sku,
      unitType: item.product.unitOfMeasure,
      quantity: item.quantity,
      internalCode: item.product.sku,
      salesTotal: item.total,
      total: item.total,
      valueDifference: 0,
      totalTaxableFees: 0,
      netTotal: Number(item.total || 0),
      itemsDiscount: 0,
      discount: { amount: 0 },
      taxableItems: [{ taxType: "T1" as const, amount: Number(item.total || 0) * 0.14, subType: "V001", rate: 14 }],
    })),
    totalSalesAmount: invoice.subtotal,
    netAmount: invoice.subtotal,
    taxTotals: [{ taxType: "T1" as const, amount: invoice.vatAmount }],
    totalAmount: Number(invoice.total ?? 0),
  };

  try {
    const result = await etaClient.submitInvoice(payload as unknown as import("@/lib/eta/types").EtaInvoicePayload);

    // Update invoice and populate the order's etaSubmissionId atomically
    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          etaUuid: result.uuid,
          etaStatus: "SUBMITTING",
          submissionLog: JSON.stringify({ submissions: [result] }),
          status: "SUBMITTED",
        },
      });

      // Populate Order.etaSubmissionId so the order tracks its ETA UUID directly
      // without needing to join through the invoice relation
      if (invoice.orderId) {
        await tx.order.update({
          where: { id: invoice.orderId },
          data: { etaSubmissionId: result.uuid },
        });
      }
    });

    await audit({
      entityType: "INVOICE",
      entityId: data.invoiceId,
      action: "ETA_SUBMIT",
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
      afterState: { etaUuid: result.uuid, status: "SUBMITTED" },
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent"),
    });

    return success({ message: "Invoice submitted to ETA", etaUuid: result.uuid, submissionId: result.submissionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ETA error";
    return error(`ETA submission failed: ${message}`, 502);
  }
}, { rateLimit: "api" });
