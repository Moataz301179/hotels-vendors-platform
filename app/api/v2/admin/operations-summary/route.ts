import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";

type InvoiceSummaryRow = {
  paymentStatus: string;
  _count: { _all: number };
  _sum: { total: unknown; platformFee: unknown; hotelAdminFeeAmount: unknown };
};

type PaymentSummaryRow = {
  status: string;
  _count: { _all: number };
  _sum: { amount: unknown };
};

const numeric = (value: unknown) => Number(value ?? 0);
const privateHeaders = { "Cache-Control": "private, no-store" };

/**
 * Platform-only operational totals. This intentionally returns no hotel,
 * supplier, invoice, payment, or commercial record detail.
 */
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401, headers: privateHeaders });
  if (actor.platformRole !== "ADMIN") return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403, headers: privateHeaders });

  const [pendingRegistrations, pendingCatalogReviews, pendingDirectoryCandidates, invoiceRows, paymentRows] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING_VERIFICATION", deletedAt: null } }),
    prisma.product.count({ where: { source: "MANUAL", sourceProvider: "SUPPLIER_SUBMISSION", status: "INACTIVE", deletedAt: null } }),
    prisma.directoryCandidate.count({ where: { reviewStatus: "PENDING_REVIEW", deletedAt: null } }),
    prisma.invoice.groupBy({
      by: ["paymentStatus"],
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: { total: true, platformFee: true, hotelAdminFeeAmount: true },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  const invoiceByStatus = new Map((invoiceRows as InvoiceSummaryRow[]).map((row) => [row.paymentStatus, row]));
  const paymentByStatus = new Map((paymentRows as PaymentSummaryRow[]).map((row) => [row.status, row]));
  const invoice = (status: string) => invoiceByStatus.get(status);
  const invoiceCount = (status: string) => invoice(status)?._count._all ?? 0;
  const invoiceTotal = (status: string) => numeric(invoice(status)?._sum.total);
  const paid = invoice("PAID");

  return NextResponse.json({
    reviewQueues: { pendingRegistrations, pendingCatalogReviews, pendingDirectoryCandidates },
    collections: {
      outstandingInvoices: invoiceCount("UNPAID") + invoiceCount("PARTIALLY_PAID") + invoiceCount("OVERDUE"),
      openInvoiceFaceValue: invoiceTotal("UNPAID") + invoiceTotal("PARTIALLY_PAID") + invoiceTotal("OVERDUE"),
      paidInvoices: invoiceCount("PAID"),
      paidGross: invoiceTotal("PAID"),
      factoredInvoices: invoiceCount("FACTORED"),
      factoredGross: invoiceTotal("FACTORED"),
      cashBasisPlatformFees: numeric(paid?._sum.platformFee) + numeric(paid?._sum.hotelAdminFeeAmount),
      paymentTransactions: {
        pending: paymentByStatus.get("PENDING")?._count._all ?? 0,
        paid: paymentByStatus.get("PAID")?._count._all ?? 0,
      },
    },
  }, { headers: privateHeaders });
}
