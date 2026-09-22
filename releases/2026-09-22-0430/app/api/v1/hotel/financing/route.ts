import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, requirePermission } from "@/lib/api-utils";

/**
 * Hotel financing overview for the INVO HotelFinancingScreen.
 *
 * GET /api/v1/hotel/financing
 * Returns eligibleInvoices[], activeFinancing[] and creditApplications[] derived
 * from real Invoice, FactoringRequest and CreditLineApplication rows for the
 * tenant. Honest empty arrays when none exist.
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "report:read");

  const [invoices, requests, applications] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        tenantId: auth.tenantId,
        paymentStatus: { notIn: ["PAID"] },
      },
      orderBy: { issueDate: "desc" },
      take: 50,
      include: { supplier: { select: { name: true } } },
    }),
    prisma.factoringRequest.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        factoringCompany: { select: { name: true } },
        invoice: { select: { invoiceNumber: true, total: true } },
      },
    }),
    prisma.creditLineApplication.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, status: true, createdAt: true, hotelName: true },
    }),
  ]);

  const eligibleInvoices = invoices
    .filter((i) => i.total != null && Number(i.total) > 0)
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.total != null ? Number(inv.total) : 0,
      supplierName: inv.supplier?.name ?? "",
      dueDate: inv.dueDate?.toISOString() ?? null,
      factoringEligible: inv.etaStatus === "ACCEPTED",
    }));

  const activeFinancing = requests
    .filter((r) => ["PENDING", "UNDER_REVIEW", "APPROVED", "DISBURSED"].includes(r.status))
    .map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice?.invoiceNumber ?? "",
      financedAmount: r.invoice?.total != null ? Number(r.invoice.total) : 0,
      advanceRate: 80,
      discountRate: r.riskScore != null ? Math.max(1, (100 - r.riskScore) / 25) : 3,
      status: r.status,
      partnerName: r.factoringCompany?.name ?? "",
    }));

  const creditApplications = applications.map((a) => ({
    id: a.id,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    hotelName: a.hotelName,
  }));

  return success({
    eligibleInvoices,
    activeFinancing,
    creditApplications,
  });
});