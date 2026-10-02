import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server-auth";
import { DollarSign, Clock, AlertTriangle, TrendingUp, ArrowUpRight } from "lucide-react";

export default async function HotelCashflowPage() {
  const user = await requireAuth();

  // G1: TENANT ISOLATION — scoped to the authenticated user's tenant and hotel
  const hotels = await prisma.hotel.findMany({
    where: {
      tenantId: user.tenantId,
      ...(user.hotelId ? { id: user.hotelId } : {}),
    },
    take: 1,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      creditLimit: true,
      creditUsed: true,
    },
  });

  const hotel = hotels[0];
  const hotelId = hotel?.id;

  // Monthly spend overview (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyOrders = hotelId
    ? await prisma.order.groupBy({
        by: ["status"],
        where: {
          hotelId,
          createdAt: { gte: sixMonthsAgo },
        },
        _sum: { total: true },
        _count: true,
      })
    : [];

  const totalSpend = monthlyOrders.reduce(
    (sum, o) => sum + Number(o._sum.total ?? 0),
    0
  );
  const orderCount = monthlyOrders.reduce((sum, o) => sum + o._count, 0);

  // Pending invoices
  const pendingInvoices = hotelId
    ? await prisma.invoice.findMany({
        where: {
          hotelId,
          status: { in: ["DRAFT", "ISSUED" as const] },
          paymentStatus: { not: "PAID" },
        },
        orderBy: { dueDate: "asc" },
        take: 15,
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          dueDate: true,
          status: true,
          paymentStatus: true,
          supplier: { select: { name: true } },
          order: { select: { orderNumber: true } },
        },
      })
    : [];

  // Overdue invoices
  const overdueInvoices = hotelId
    ? await prisma.invoice.findMany({
        where: {
          hotelId,
          paymentStatus: { not: "PAID" },
          dueDate: { lt: new Date() },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          dueDate: true,
          supplier: { select: { name: true } },
        },
      })
    : [];

  // Upcoming payments (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const upcomingPayments = hotelId
    ? await prisma.invoice.findMany({
        where: {
          hotelId,
          paymentStatus: { not: "PAID" },
          dueDate: { gte: new Date(), lte: thirtyDaysFromNow },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          dueDate: true,
          supplier: { select: { name: true } },
        },
      })
    : [];

  // Monthly trend (last 6 months by month)
  const monthlyTrend: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const monthTotal = hotelId
      ? await prisma.order.aggregate({
          where: {
            hotelId,
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { total: true },
        })
      : { _sum: { total: 0 } };

    monthlyTrend.push({
      month: startOfMonth.toLocaleDateString("en-EG", { month: "short", year: "2-digit" }),
      total: Number(monthTotal._sum.total ?? 0),
    });
  }

  const maxMonthly = Math.max(...monthlyTrend.map((m) => m.total), 1);

  const pendingTotal = pendingInvoices.reduce(
    (sum, inv) => sum + Number(inv.total ?? 0),
    0
  );
  const overdueTotal = overdueInvoices.reduce(
    (sum, inv) => sum + Number(inv.total ?? 0),
    0
  );
  const upcomingTotal = upcomingPayments.reduce(
    (sum, inv) => sum + Number(inv.total ?? 0),
    0
  );

  const formatEGP = (n: number) =>
    new Intl.NumberFormat("en-EG", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " EGP";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Cashflow Overview</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Track spend, payments, and upcoming obligations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground-tertiary text-xs uppercase tracking-wider font-medium">
            <DollarSign size={14} />
            Total Spend (6mo)
          </div>
          <p className="text-2xl font-bold text-white metric-value">{formatEGP(totalSpend)}</p>
          <p className="text-xs text-foreground-muted">{orderCount} orders placed</p>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground-tertiary text-xs uppercase tracking-wider font-medium">
            <Clock size={14} />
            Pending Payments
          </div>
          <p className="text-2xl font-bold text-amber-400 metric-value">{formatEGP(pendingTotal)}</p>
          <p className="text-xs text-foreground-muted">{pendingInvoices.length} invoices</p>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground-tertiary text-xs uppercase tracking-wider font-medium">
            <AlertTriangle size={14} />
            Overdue
          </div>
          <p className="text-2xl font-bold text-red-400 metric-value">{formatEGP(overdueTotal)}</p>
          <p className="text-xs text-foreground-muted">{overdueInvoices.length} invoices</p>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground-tertiary text-xs uppercase tracking-wider font-medium">
            <TrendingUp size={14} />
            Upcoming (30d)
          </div>
          <p className="text-2xl font-bold text-blue-400 metric-value">{formatEGP(upcomingTotal)}</p>
          <p className="text-xs text-foreground-muted">{upcomingPayments.length} invoices</p>
        </div>
      </div>

      {/* Monthly Spend Chart */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-4">Monthly Spend (Last 6 Months)</h3>
        <div className="flex items-end gap-3 h-48">
          {monthlyTrend.map((m, i) => {
            const height = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-foreground-muted metric-value">
                  {m.total > 0 ? formatEGP(m.total) : "—"}
                </span>
                <div className="w-full relative" style={{ height: "120px" }}>
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-md transition-all duration-500"
                    style={{
                      width: "70%",
                      height: `${Math.max(height, 2)}%`,
                      background:
                        i === monthlyTrend.length - 1
                          ? "linear-gradient(180deg, var(--accent-base), rgba(20, 184, 166, 0.3))"
                          : "linear-gradient(180deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))",
                    }}
                  />
                </div>
                <span className="text-[10px] text-foreground-muted">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending & Overdue Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Payments */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle">
            <h3 className="font-semibold text-white">Pending Payments</h3>
          </div>
          {pendingInvoices.length === 0 ? (
            <div className="px-5 py-12 text-center text-foreground-muted">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No pending payments</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {pendingInvoices.map((inv) => {
                const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();
                return (
                  <div key={inv.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{inv.supplier?.name ?? "Unknown"}</p>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          {inv.invoiceNumber} · {inv.order?.orderNumber ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white metric-value">
                          {formatEGP(Number(inv.total ?? 0))}
                        </p>
                        <p className={`text-xs ${isOverdue ? "text-red-400" : "text-foreground-muted"}`}>
                          {inv.dueDate
                            ? `Due ${new Date(inv.dueDate).toLocaleDateString("en-EG", { month: "short", day: "numeric" })}`
                            : "No due date"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Payments */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle">
            <h3 className="font-semibold text-white">Upcoming (30 Days)</h3>
          </div>
          {upcomingPayments.length === 0 ? (
            <div className="px-5 py-12 text-center text-foreground-muted">
              <ArrowUpRight size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No upcoming payments</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {upcomingPayments.map((inv) => (
                <div key={inv.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{inv.supplier?.name ?? "Unknown"}</p>
                      <p className="text-xs text-foreground-muted mt-0.5">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white metric-value">
                        {formatEGP(Number(inv.total ?? 0))}
                      </p>
                      <p className="text-xs text-blue-400">
                        Due{" "}
                        {inv.dueDate
                          ? new Date(inv.dueDate).toLocaleDateString("en-EG", {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
