"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  Package,
  Hotel,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { LoadingPage } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";
import { Sparkline } from "@/components/dashboards/shared/sparkline";
import { MetricTile } from "@/components/dashboards/shared/metric-tile";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface TopProduct {
  name: string;
  sku?: string;
  sold: number;
  revenue: number;
}

interface OrdersByStatus {
  status: string;
  count: number;
  color?: string;
}

interface CustomerHotel {
  name: string;
  orders: number;
  revenue: number;
}

interface AnalyticsData {
  salesTrend: number[];
  topProducts: TopProduct[];
  ordersByStatus: OrdersByStatus[];
  revenue: {
    current: number;
    previous: number;
    currency?: string;
  };
  customerHotels: CustomerHotel[];
}

function formatCurrency(amount: number, currency = "EGP") {
  return `${currency} ${amount.toLocaleString("en-EG")}`;
}

function SimpleBarChart({ data }: { data: OrdersByStatus[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.status} className="flex items-center gap-3">
          <span className="text-[11px] text-foreground-muted w-20 truncate">{item.status}</span>
          <div className="flex-1 h-5 bg-surface-1 rounded-md overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / max) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-md"
              style={{ backgroundColor: item.color || "rgba(255,255,255,0.15)" }}
            />
          </div>
          <span className="text-[11px] font-medium text-white w-6 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function RevenueComparison({ current, previous, currency }: { current: number; previous: number; currency?: string }) {
  const diff = current - previous;
  const pct = previous > 0 ? ((diff / previous) * 100).toFixed(1) : "0";
  const isUp = diff >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider">This Month</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(current, currency)}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(Number(pct))}%
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Last Month</p>
          <p className="text-lg font-semibold text-foreground-secondary mt-1">{formatCurrency(previous, currency)}</p>
        </div>
      </div>
      <div className="h-2 bg-surface-1 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((current / Math.max(previous, 1)) * 50, 100)}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-emerald-500/40 rounded-full"
        />
      </div>
    </div>
  );
}

export default function SupplierAnalyticsPage() {
  const { data, loading, error } = useApi<AnalyticsData>("/api/analytics");

  const analytics = data;

  const stats = useMemo(() => {
    if (!analytics) return [];
    const totalSales = analytics.salesTrend.reduce((a, b) => a + b, 0);
    const totalOrders = analytics.ordersByStatus.reduce((a, b) => a + b.count, 0);
    const topProduct = analytics.topProducts[0];
    const activeHotels = analytics.customerHotels.length;

    return [
      { label: "Total Sales", value: formatCurrency(totalSales, analytics.revenue?.currency), icon: TrendingUp },
      { label: "Total Orders", value: totalOrders.toString(), icon: BarChart3 },
      { label: "Top Product", value: topProduct?.name ?? "—", icon: Package },
      { label: "Active Hotels", value: activeHotels.toString(), icon: Hotel },
    ];
  }, [analytics]);

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto">
        <LoadingPage />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto">
        <EmptyState title="Error loading analytics" description={error} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-[1600px] mx-auto">
        <EmptyState title="No analytics data" description="Analytics will appear once you start receiving orders." />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
        <p className="text-sm text-foreground-muted mt-0.5">Performance insights and sales trends</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeInUp}>
            <MetricTile
              label={s.label}
              value={s.value}
              icon={s.icon}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Top Row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Trend */}
        <div className="lg:col-span-2 rounded-xl border border-border-subtle bg-surface-1 p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp size={14} className="text-foreground-muted" />
              Sales Trend
            </h3>
            <span className="text-[10px] text-foreground-muted flex items-center gap-1">
              <Calendar size={10} />
              Last 30 days
            </span>
          </div>
          {analytics.salesTrend.length > 0 ? (
            <div className="flex items-end gap-1 h-40">
              {analytics.salesTrend.map((value, i) => {
                const max = Math.max(...analytics.salesTrend, 1);
                const height = (value / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.5, delay: i * 0.02 }}
                      className="w-full bg-surface-2 hover:bg-surface-2 rounded-t-sm transition-colors relative group"
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-2 border border-border-subtle px-1.5 py-0.5 rounded text-[9px] text-white whitespace-nowrap">
                        {formatCurrency(value, analytics.revenue?.currency)}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No trend data" description="Sales data will appear here once orders start flowing." />
          )}
        </div>

        {/* Revenue Comparison */}
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-foreground-muted" />
            Revenue
          </h3>
          <RevenueComparison
            current={analytics.revenue.current}
            previous={analytics.revenue.previous}
            currency={analytics.revenue.currency}
          />
        </div>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders by Status */}
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-foreground-muted" />
            Orders by Status
          </h3>
          {analytics.ordersByStatus.length > 0 ? (
            <SimpleBarChart data={analytics.ordersByStatus} />
          ) : (
            <EmptyState title="No order data" description="Order status data will appear here." />
          )}
        </div>

        {/* Top Products */}
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Package size={14} className="text-foreground-muted" />
            Top Selling Products
          </h3>
          {analytics.topProducts.length > 0 ? (
            <div className="space-y-3">
              {analytics.topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-1 border border-border-invisible">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-foreground-muted w-4">{i + 1}</span>
                    <div>
                      <p className="text-xs text-white">{product.name}</p>
                      {product.sku && <p className="text-[10px] text-foreground-muted">{product.sku}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white">{formatCurrency(product.revenue, analytics.revenue?.currency)}</p>
                    <p className="text-[10px] text-foreground-muted">{product.sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No product data" description="Top products will appear here once sales begin." icon="package" />
          )}
        </div>

        {/* Customer Hotels */}
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Hotel size={14} className="text-foreground-muted" />
            Top Customer Hotels
          </h3>
          {analytics.customerHotels.length > 0 ? (
            <div className="space-y-3">
              {analytics.customerHotels.map((hotel, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-1 border border-border-invisible">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-foreground-muted w-4">{i + 1}</span>
                    <div>
                      <p className="text-xs text-white">{hotel.name}</p>
                      <p className="text-[10px] text-foreground-muted">{hotel.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Sparkline
                      data={[hotel.revenue * 0.3, hotel.revenue * 0.5, hotel.revenue * 0.4, hotel.revenue * 0.7, hotel.revenue]}
                      width={60}
                      height={24}
                      color="rgba(255,255,255,0.3)"
                      fillColor="rgba(255,255,255,0.04)"
                    />
                    <p className="text-[10px] text-foreground-muted mt-1">{formatCurrency(hotel.revenue, analytics.revenue?.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No customers yet" description="Hotel customers will appear here." />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
