import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server-auth";
import { CreditCard, TrendingUp, TrendingDown, AlertCircle, Clock } from "lucide-react";

export default async function HotelCreditPage() {
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
      tier: true,
      riskTier: true,
    },
  });

  const hotel = hotels[0];

  const creditLimit = hotel ? Number(hotel.creditLimit ?? 0) : 0;
  const creditUsed = hotel ? Number(hotel.creditUsed ?? 0) : 0;
  const available = Math.max(0, creditLimit - creditUsed);
  const utilizationRate = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  // Fetch recent credit transactions for this hotel
  const recentTransactions = hotel
    ? await prisma.creditTransaction.findMany({
        where: { hotelId: hotel.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          createdAt: true,
        },
      })
    : [];

  // Fetch credit facilities for this hotel
  const creditFacilities = hotel
    ? await prisma.creditFacility.findMany({
        where: { hotelId: hotel.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          limit: true,
          utilized: true,
          interestRate: true,
          approvedAt: true,
          expiresAt: true,
          factoringCompany: { select: { name: true } },
        },
      })
    : [];

  const formatEGP = (n: number) =>
    new Intl.NumberFormat("en-EG", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " EGP";

  const transactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CREDIT_RELEASED: "Credit Released",
      CREDIT_UTILIZED: "Credit Utilized",
      CREDIT_REPAID: "Credit Repaid",
      FACTORING_ADVANCE: "Factoring Advance",
      FACTORING_SETTLEMENT: "Factoring Settlement",
      ORDER_CAPTURE: "Order Capture",
      PAYMENT_RECEIVED: "Payment Received",
    };
    return labels[type] ?? type;
  };

  const facilityStatusLabel = (status: string) => {
    const s: Record<string, { bg: string; text: string; border: string }> = {
      ACTIVE: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
      PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
      EXPIRED: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
      SUSPENDED: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    };
    return s[status] ?? { bg: "bg-surface-2", text: "text-foreground-secondary", border: "border-border-subtle" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Credit Management</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Monitor your credit limit, utilization, and facility status
        </p>
      </div>

      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground-tertiary text-xs uppercase tracking-wider font-medium">
            <CreditCard size={14} />
            Credit Limit
          </div>
          <p className="text-2xl font-bold text-white metric-value">{formatEGP(creditLimit)}</p>
          <p className="text-xs text-foreground-muted">{hotel?.tier ?? "N/A"} tier</p>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground-tertiary text-xs uppercase tracking-wider font-medium">
            <TrendingUp size={14} />
            Credit Used
          </div>
          <p className="text-2xl font-bold text-orange-400 metric-value">{formatEGP(creditUsed)}</p>
          <p className="text-xs text-foreground-muted">{utilizationRate.toFixed(1)}% utilized</p>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground-tertiary text-xs uppercase tracking-wider font-medium">
            <TrendingDown size={14} />
            Available Balance
          </div>
          <p className="text-2xl font-bold text-emerald-400 metric-value">{formatEGP(available)}</p>
          <p className="text-xs text-foreground-muted">
            {utilizationRate > 80 ? "Low availability" : "Healthy balance"}
          </p>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground-tertiary text-xs uppercase tracking-wider font-medium">
            <AlertCircle size={14} />
            Risk Tier
          </div>
          <p className="text-2xl font-bold text-white metric-value">{hotel?.riskTier ?? "N/A"}</p>
          <p className="text-xs text-foreground-muted">Based on payment history</p>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="glass-card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-white">Credit Utilization</h3>
          <span className="text-sm text-foreground-tertiary">{utilizationRate.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(utilizationRate, 100)}%`,
              background:
                utilizationRate > 80
                  ? "linear-gradient(90deg, var(--error), #b07b3e)"
                  : utilizationRate > 50
                    ? "linear-gradient(90deg, #b07b3e, #eab308)"
                    : "linear-gradient(90deg, var(--accent-base), var(--success))",
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-foreground-muted">
          <span>{formatEGP(creditUsed)} used</span>
          <span>{formatEGP(creditLimit)} limit</span>
        </div>
      </div>

      {/* Credit Facilities */}
      {creditFacilities.length > 0 && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-white">Credit Facilities</h3>
          <div className="space-y-3">
            {creditFacilities.map((f) => {
              const statusStyle = facilityStatusLabel(f.status);
              return (
                <div key={f.id} className="p-4 rounded-xl bg-surface-1 border border-border-subtle">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {f.factoringCompany?.name ?? "Unknown Provider"}
                      </p>
                      <p className="text-xs text-foreground-muted mt-1">
                        Limit: {formatEGP(Number(f.limit ?? 0))} · Utilized: {formatEGP(Number(f.utilized ?? 0))}
                      </p>
                    </div>
                    <span className={`status-pill ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      {f.status}
                    </span>
                  </div>
                  {f.interestRate && (
                    <p className="text-xs text-foreground-muted mt-2">
                      Interest Rate: {(Number(f.interestRate) * 100).toFixed(2)}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Credit History */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle">
          <h3 className="font-semibold text-white">Credit History</h3>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="px-5 py-12 text-center text-foreground-muted">
            <Clock size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No credit transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-white">{transactionTypeLabel(tx.type)}</p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {tx.description ?? new Date(tx.createdAt).toLocaleDateString("en-EG")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold metric-value ${
                      tx.amount && Number(tx.amount) < 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {tx.amount ? formatEGP(Math.abs(Number(tx.amount))) : "—"}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {new Date(tx.createdAt).toLocaleDateString("en-EG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
