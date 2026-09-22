"use client";

import { BarChart3, TrendingUp, Users, Target, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { useApi } from "@/lib/hooks/use-api";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

interface AccountingData {
  totalRevenue: number;
  platformFees: number;
  outstandingInvoices: { total: number; count: number };
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
  recentTransactions: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    hotelName: string;
    supplierName: string;
  }>;
  orderCount: number;
}

const LEADS_BY_SOURCE = [
  { source: "Organic Search", count: 342, color: "#10b981" },
  { source: "LinkedIn Ads", count: 218, color: "var(--info)" },
  { source: "Direct Outreach", count: 156, color: "#8b5cf6" },
  { source: "Referrals", count: 124, color: "#f59e0b" },
  { source: "Events", count: 89, color: "var(--error)" },
  { source: "Facebook", count: 67, color: "#06b6d4" },
];

export default function AnalyticsPage() {
  const { data, loading, error } = useApi<AccountingData>("/api/v1/admin/accounting");

  const formatEgp = (v: number) => `EGP ${(v / 1000).toFixed(0)}K`;
  const maxLeads = Math.max(...LEADS_BY_SOURCE.map((s) => s.count));

  const kpiCards = [
    { label: "Total Leads", value: "1,247", icon: Users, color: "#10b981", change: "+18%", up: true },
    { label: "Conversion Rate", value: "4.2%", icon: Target, color: "var(--info)", change: "+0.8%", up: true },
    { label: "Campaign ROI", value: "3.8x", icon: TrendingUp, color: "#8b5cf6", change: "+0.5x", up: true },
    { label: "Cost per Acquisition", value: "EGP 2,450", icon: DollarSign, color: "#f59e0b", change: "-12%", up: false },
  ];

  const monthlyTrends = [
    { month: "Jul", leads: 142, conversions: 6 },
    { month: "Jun", leads: 128, conversions: 5 },
    { month: "May", leads: 156, conversions: 7 },
    { month: "Apr", leads: 118, conversions: 4 },
    { month: "Mar", leads: 134, conversions: 6 },
    { month: "Feb", leads: 98, conversions: 3 },
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <PageHeader
        title="Marketing Analytics"
        description="Campaign performance, attribution, and ROI insights"
        action={
          <button className="px-4 py-2 rounded-lg bg-[var(--accent-500)] text-white text-sm font-medium hover:bg-[var(--accent-600)] transition-colors">
            Export Report
          </button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-surface-1 border border-border-subtle"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              <span className="text-[10px] text-foreground-muted uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className="text-[18px] font-bold text-white">{loading ? "—" : kpi.value}</div>
            <div className="flex items-center gap-1 mt-1">
              {kpi.up ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-emerald-400" />
              )}
              <span className="text-[11px] text-emerald-400">{kpi.change}</span>
              <span className="text-[10px] text-foreground-muted">vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Leads by Source */}
        <SectionCard title="Leads by Source" description="Acquisition channel breakdown">
          <div className="space-y-3">
            {LEADS_BY_SOURCE.map((source) => (
              <div key={source.source} className="flex items-center gap-3">
                <span className="text-[12px] text-foreground-secondary w-32 truncate">{source.source}</span>
                <div className="flex-1 h-6 rounded-lg bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(8, (source.count / maxLeads) * 100)}%`,
                      backgroundColor: `${source.color}33`,
                      borderLeft: `3px solid ${source.color}`,
                    }}
                  >
                    <span className="text-[11px] font-medium text-foreground-secondary">{source.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Monthly Growth */}
        <SectionCard title="Monthly Growth" description="Lead generation and conversion trends">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-500)]" />
                <span className="text-foreground-muted">Leads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-foreground-muted">Conversions</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-32">
              {monthlyTrends.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: "100px" }}>
                    <div
                      className="w-[40%] rounded-t bg-[var(--accent-500)]/40"
                      style={{ height: `${(m.leads / 160) * 100}%` }}
                    />
                    <div
                      className="w-[40%] rounded-t bg-emerald-500/50"
                      style={{ height: `${(m.conversions / 8) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-foreground-muted">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Platform Revenue Overview */}
        <SectionCard title="Platform Revenue" description="Real-time accounting data">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-1">
                <p className="text-[10px] text-foreground-muted uppercase">Total Revenue</p>
                <p className="text-[16px] font-bold text-white mt-1">
                  {loading ? "—" : formatEgp(data?.totalRevenue || 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-1">
                <p className="text-[10px] text-foreground-muted uppercase">Platform Fees (2.5%)</p>
                <p className="text-[16px] font-bold text-emerald-400 mt-1">
                  {loading ? "—" : formatEgp(data?.platformFees || 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-1">
                <p className="text-[10px] text-foreground-muted uppercase">Outstanding Invoices</p>
                <p className="text-[16px] font-bold text-amber-400 mt-1">
                  {loading ? "—" : data?.outstandingInvoices?.count ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-1">
                <p className="text-[10px] text-foreground-muted uppercase">Total Orders</p>
                <p className="text-[16px] font-bold text-white mt-1">
                  {loading ? "—" : data?.orderCount ?? 0}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Recent Transactions */}
        <SectionCard title="Recent Transactions" description="Latest completed orders">
          <div className="space-y-2">
            {loading ? (
              <p className="text-[12px] text-foreground-muted py-8 text-center">Loading...</p>
            ) : data?.recentTransactions?.length ? (
              data.recentTransactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-1">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-white truncate">{tx.orderNumber}</p>
                    <p className="text-[10px] text-foreground-muted truncate">
                      {tx.hotelName} → {tx.supplierName}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-[12px] font-semibold text-emerald-400">{formatEgp(tx.total)}</p>
                    <p className="text-[10px] text-foreground-muted">{tx.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-foreground-muted py-8 text-center">No transactions yet</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
