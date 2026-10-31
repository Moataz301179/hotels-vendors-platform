"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

interface LedgerRow {
  id: string;
  invoiceId: string;
  hotel: string;
  supplier: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "invoiced" | "delivered" | "overdue";
  date: string;
  taxStamp: string;
  ledgerHash: string;
  riskScore: number;
}

const EMPTY_KPIS: KPIData[] = [
  { label: "Available Capital", value: "—", change: "—", trend: "neutral", icon: <DollarSign size={20} /> },
  { label: "Utilized Credit", value: "—", change: "—", trend: "neutral", icon: <Activity size={20} /> },
  { label: "Real-time Risk Score", value: "—", change: "—", trend: "neutral", icon: <ShieldCheck size={20} /> },
  { label: "Settlement Rate", value: "—", change: "—", trend: "neutral", icon: <TrendingUp size={20} /> },
];

const EMPTY_LEDGER: LedgerRow[] = [];

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  paid: { bg: "bg-success-bg", text: "text-success" },
  pending: { bg: "bg-warning-bg", text: "text-warning" },
  invoiced: { bg: "bg-purple-base/10", text: "text-purple-base" },
  delivered: { bg: "bg-info-bg", text: "text-info" },
  overdue: { bg: "bg-error-bg", text: "text-error" },
};

function StatusTag({ status }: { status: LedgerRow["status"] }) {
  const c = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span className={cn("status-pill", c.bg, c.text)}>
      {status}
    </span>
  );
}

function riskColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

export function FinancialDashboard({ kpis, ledgerData }: { kpis?: KPIData[]; ledgerData?: LedgerRow[] }) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 5;

  const activeKpis = kpis && kpis.length > 0 ? kpis : EMPTY_KPIS;
  const activeLedger = ledgerData && ledgerData.length > 0 ? ledgerData : EMPTY_LEDGER;

  const filtered = activeLedger.filter(
    (row) =>
      row.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.hotel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeKpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-border-default bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-foreground-muted uppercase tracking-[0.05em]">{kpi.label}</span>
              <span className="text-purple-base">{kpi.icon}</span>
            </div>
            <div className="text-2xl font-semibold text-foreground">{kpi.value}</div>
            <div className="flex items-center gap-1 mt-2">
              {kpi.trend === "up" ? (
                <TrendingUp size={14} className="text-success" />
              ) : (
                <TrendingDown size={14} className="text-error" />
              )}
              <span className={cn("text-xs font-medium", kpi.trend === "up" ? "text-success" : "text-error")}>
                {kpi.change}
              </span>
              <span className="text-xs text-foreground-muted">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-border-default bg-surface shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-raised">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Transactions Ledger</h2>
            <p className="text-xs text-foreground-muted mt-0.5">{filtered.length} transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg bg-surface border border-border-default text-foreground placeholder:text-foreground-muted outline-none focus:border-accent-base/30 focus:ring-1 focus:ring-accent-base/10 transition-colors w-56"
            />
            <button className="text-xs font-medium px-4 py-2 rounded-lg bg-accent-base text-surface hover:bg-accent-dark transition-colors flex items-center gap-1.5">
              New Invoice <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-raised">
              {["Invoice", "Hotel", "Supplier", "Amount", "Status", "Date", "Risk"].map((h, i) => (
                <th
                  key={h}
                  className="px-5 py-2.5 text-left font-medium text-foreground-secondary uppercase tracking-[0.05em]"
                  style={{ textAlign: i === 3 ? "right" : i === 4 || i === 6 ? "center" : "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <LedgerRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border-subtle bg-surface-raised">
          <span className="text-xs text-foreground-muted">
            Showing {start + 1}-{Math.min(start + pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                page === 1
                  ? "border-border-subtle text-foreground-muted cursor-not-allowed"
                  : "border-border-subtle text-foreground hover:bg-white/[0.03]"
              )}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={start + pageSize >= filtered.length}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                start + pageSize >= filtered.length
                  ? "border-border-subtle text-foreground-muted cursor-not-allowed"
                  : "border-border-subtle text-foreground hover:bg-white/[0.03]"
              )}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LedgerRow({ row }: { row: LedgerRow }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="group cursor-pointer border-b border-border-subtle hover:bg-accent-muted transition-colors"
      >
        <td className="px-5 py-3 font-mono text-xs text-purple-base font-medium">{row.invoiceId}</td>
        <td className="px-5 py-3 text-foreground">{row.hotel}</td>
        <td className="px-5 py-3 text-foreground-secondary">{row.supplier}</td>
        <td className="px-5 py-3 text-right font-semibold text-foreground">
          {row.amount.toLocaleString("en-EG")} {row.currency}
        </td>
        <td className="px-5 py-3 text-center"><StatusTag status={row.status} /></td>
        <td className="px-5 py-3 text-foreground-secondary">{row.date}</td>
        <td className="px-5 py-3 text-center">
          <span className={cn("text-xs font-semibold", riskColor(row.riskScore))}>{row.riskScore}</span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="p-5 bg-surface-raised border-b border-border-subtle">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetadataCard label="Digital Tax Stamp" value={row.taxStamp} sublabel="ETA UUID validated" />
              <MetadataCard label="Ledger Hash" value={row.ledgerHash} sublabel="SHA-256 cryptographic proof" />
              <MetadataCard label="Transaction Score" value={`${row.riskScore}/100`} sublabel={row.riskScore >= 80 ? "Low risk — approved" : row.riskScore >= 60 ? "Medium risk — monitoring" : "High risk — review required"} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function MetadataCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="p-4 bg-surface border border-border-default rounded-lg">
      <div className="text-[10px] font-medium text-foreground-muted uppercase tracking-[0.05em] mb-1.5">{label}</div>
      <div className="text-xs font-semibold text-foreground font-mono mb-1">{value}</div>
      <div className="text-[10px] text-foreground-secondary">{sublabel}</div>
    </div>
  );
}
