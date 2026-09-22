import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";
import { createEscrowDeposit, releaseEscrowToken, getEscrowStatus } from "@/lib/payments/paymob-escrow";
import { z } from "zod";

const CreateSchema = z.object({
  invoiceId: z.string().cuid(),
});

const ReleaseSchema = z.object({
  invoiceId: z.string().cuid(),
  releaseType: z.enum(["DUE_DATE", "EARLY_PAYMENT", "MANUAL"]),
  funderId: z.string().optional(),
  coApproverId: z.string().cuid(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "payment:write");

  const body = await request.json();
  const data = CreateSchema.parse(body);

  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { hotel: true, supplier: true },
  });

  if (!invoice || invoice.tenantId !== auth.tenantId) {
    return error("Invoice not found", 404);
  }

  const result = await createEscrowDeposit({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: Number(invoice.total),
    hotelId: invoice.hotelId,
    supplierId: invoice.supplierId,
    hotelName: invoice.hotel?.name || "Hotel",
    supplierName: invoice.supplier?.name || "Supplier",
    dueDate: invoice.dueDate,
    etaUuid: invoice.etaUuid,
    tenantId: auth.tenantId,
  });

  return success(result);
});

export const PUT = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "payment:release");

  const body = await request.json();
  const data = ReleaseSchema.parse(body);

  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
  });

  if (!invoice || invoice.tenantId !== auth.tenantId) {
    return error("Invoice not found", 404);
  }

  const result = await releaseEscrowToken({
    invoiceId: data.invoiceId,
    releaseType: data.releaseType,
    funderId: data.funderId,
    approverId: auth.userId,
    coApproverId: data.coApproverId,
  });

  return success(result);
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoiceId");

  if (!invoiceId) {
    return error("Provide ?invoiceId= parameter", 400);
  }

  const status = await getEscrowStatus(invoiceId);
  return success(status);
});
