import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, requirePermission } from "@/lib/api-utils";

/**
 * Hotel cash-flow overview for the INVO HotelCashflowScreen.
 *
 * GET /api/v1/hotel/cashflow
 * Returns monthlySpend, pending/overdue/upcoming payment totals, a spend trend
 * and recent invoices, all derived from real SpendRecord / Invoice rows for the
 * tenant. Honest zeros/empty arrays when none exist.
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "report:read");

  const year = new Date().getFullYear();
  const now = new Date();

  const [spendRecords, invoices] = await Promise.all([
    prisma.spendRecord.findMany({
      where: { tenantId: auth.tenantId, year },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    }),
    prisma.invoice.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { issueDate: "desc" },
      take: 25,
      include: { supplier: { select: { name: true } } },
    }),
  ]);

  const trend = spendRecords.map((r) => ({
    month: `${r.year}-${String(r.month).padStart(2, "0")}`,
    amount: Number(r.amount || 0),
  }));

  const monthlySpend = spendRecords.reduce((s, r) => s + Number(r.amount || 0), 0);

  let pendingPayments = 0;
  let overduePayments = 0;
  let upcomingPayments = 0;

  invoices.forEach((inv) => {
    const amount = inv.total != null ? Number(inv.total) : 0;
    if (inv.paymentStatus === "PAID") return;
    if (!inv.dueDate) {
      pendingPayments += amount;
      return;
    }
    if (inv.dueDate < now) {
      overduePayments += amount;
    } else {
      upcomingPayments += amount;
      pendingPayments += amount;
    }
  });

  const recentInvoices = invoices.slice(0, 20).map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    amount: inv.total != null ? Number(inv.total) : 0,
    dueDate: inv.dueDate?.toISOString() ?? null,
    status: inv.status,
    supplierName: inv.supplier?.name ?? "",
  }));

  return success({
    monthlySpend,
    pendingPayments,
    overduePayments,
    upcomingPayments,
    trend,
    recentInvoices,
  });
});