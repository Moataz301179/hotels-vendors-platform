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

const kpis: KPIData[] = [
  { label: "Available Capital", value: "EGP 2,450,000", change: "+12.4%", trend: "up", icon: <DollarSign size={20} /> },
  { label: "Utilized Credit", value: "EGP 1,820,000", change: "+8.2%", trend: "up", icon: <Activity size={20} /> },
  { label: "Real-time Risk Score", value: "82/100", change: "-3 pts", trend: "down", icon: <ShieldCheck size={20} /> },
  { label: "Settlement Rate", value: "94.2%", change: "+1.1%", trend: "up", icon: <TrendingUp size={20} /> },
];

const ledgerData: LedgerRow[] = [
  { id: "1", invoiceId: "INV-2026-00142", hotel: "Stella Di Mare Resort", supplier: "Nile Fresh Foods", amount: 45200, currency: "EGP", status: "paid", date: "2026-06-08", taxStamp: "ETA-UUID: a3f8c2d1-0042", ledgerHash: "0x7f3a...e2b1", riskScore: 92 },
  { id: "2", invoiceId: "INV-2026-00141", hotel: "Jaz Aquamarine", supplier: "Pyramid Linens", amount: 28700, currency: "EGP", status: "pending", date: "2026-06-07", taxStamp: "ETA-UUID: b4e9d3e2-0041", ledgerHash: "0x8a4b...f3c2", riskScore: 78 },
  { id: "3", invoiceId: "INV-2026-00140", hotel: "Sunrise Palace", supplier: "Red Sea Amenities", amount: 61500, currency: "EGP", status: "invoiced", date: "2026-06-06", taxStamp: "ETA-UUID: c5f0e4f3-0040", ledgerHash: "0x9b5c...g4d3", riskScore: 85 },
  { id: "4", invoiceId: "INV-2026-00139", hotel: "Baron Resort Sharm", supplier: "Cairo Kitchen Pro", amount: 128400, currency: "EGP", status: "delivered", date: "2026-06-05", taxStamp: "ETA-UUID: d6a1f5a4-0039", ledgerHash: "0xac6d...h5e4", riskScore: 91 },
  { id: "5", invoiceId: "INV-2026-00138", hotel: "Hurghada Grand", supplier: "Delta Maintenance", amount: 18900, currency: "EGP", status: "overdue", date: "2026-05-28", taxStamp: "ETA-UUID: e7b2a6b5-0038", ledgerHash: "0xbd7e...i6f5", riskScore: 42 },
];

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

export function FinancialDashboard() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 5;

  const filtered = ledgerData.filter(
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
        {kpis.map((kpi) => (
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
