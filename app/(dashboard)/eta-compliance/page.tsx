// app/eta-compliance/page.tsx
"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { IcShield, IcClock, IcCheck, IcAlert, IcGlobe } from "@/components/icons";
import { StatCard } from "@/components/shared/stat-card";

interface InvoiceWithEta {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  etaStatus: string;
  etaUuid: string | null;
  createdAt: string;
  order: { orderNumber: string };
  hotel: { name: string };
  supplier: { name: string };
}

interface InvoicesResponse {
  invoices: InvoiceWithEta[];
  pagination: { total: number };
}

const ETA_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Submission",
  SUBMITTED: "Submitted to ETA",
  ACCEPTED: "ETA Accepted",
  VALIDATED: "Validated",
  REJECTED: "ETA Rejected",
  CANCELLED: "Cancelled",
};

const ETA_STATUS_TONE: Record<string, "default" | "success" | "warning" | "error" | "outline"> = {
  PENDING: "warning",
  SUBMITTED: "outline",
  ACCEPTED: "success",
  VALIDATED: "success",
  REJECTED: "error",
  CANCELLED: "error",
};

export default function EtaCompliancePage() {
  const [invoices, setInvoices] = useState<InvoiceWithEta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try the dedicated ETA status endpoint first; fall back to invoices
  const fetchEtaData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try GET /api/v1/eta/status (no UUID) — may 404
      let etaSummary: { submitted: number; accepted: number; rejected: number; pending: number } | null = null;
      try {
        const etaRes = await fetch("/api/v1/eta/status", { headers: { Accept: "application/json" } });
        if (etaRes.ok) {
          etaSummary = await etaRes.json();
        }
      } catch {
        // no dedicated list endpoint — will build from invoices
      }

      // Always fetch invoices for ETA status detail
      const invRes = await fetch("/api/v1/invoices?limit=200", { headers: { Accept: "application/json" } });
      if (!invRes.ok) throw new Error("Failed to load invoice data");
      const invData: InvoicesResponse = await invRes.json();

      // Enrich with ETA status from individual UUID endpoints where available
      const enriched = await Promise.all(
        invData.invoices.map(async (inv) => {
          let etaStatus = inv.etaStatus;
          let etaUuid = inv.etaUuid;
          // If the invoice has an ETA UUID, fetch live status
          if (etaUuid) {
            try {
              const uuidRes = await fetch(`/api/v1/eta/status/${etaUuid}`, {
                headers: { Accept: "application/json" },
              });
              if (uuidRes.ok) {
                const uuidData = await uuidRes.json();
                if (uuidData.status) etaStatus = uuidData.status;
              }
            } catch {
              // keep stored status
            }
          }
          return { ...inv, etaStatus, etaUuid };
        })
      );

      setInvoices(enriched);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEtaData(); }, []);

  const submitted = invoices.filter((i) => ["SUBMITTED", "ACCEPTED", "VALIDATED"].includes(i.etaStatus));
  const pending = invoices.filter((i) => i.etaStatus === "PENDING" || !i.etaUuid);
  const rejected = invoices.filter((i) => i.etaStatus === "REJECTED");
  const accepted = invoices.filter((i) => ["ACCEPTED", "VALIDATED"].includes(i.etaStatus));
  const total = invoices.length;
  const complianceRate = total > 0 ? Math.round((accepted.length / total) * 100) : 0;

  return (
    <DashboardShell role="hotel">
      <PageHeader
        title="ETA E-Invoicing Compliance"
        description="Monitor Egyptian Tax Authority e-invoicing submission status across all invoices"
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Invoices"
          value={total}
          icon={IcInvoice}
        />
        <StatCard
          title="ETA Submitted"
          value={submitted.length}
          icon={IcGlobe}
        />
        <StatCard
          title="ETA Accepted"
          value={accepted.length}
          icon={IcCheck}
        />
        <StatCard
          title="Compliance Rate"
          value={`${complianceRate}%`}
          icon={IcShield}
        />
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {/* Compliance overview */}
      <Card className="p-5 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Compliance Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700/50 p-4 bg-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <IcClock className="h-4 w-4" />
              Pending Submission
            </div>
            <div className="text-2xl font-medium text-white">{pending.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              Invoices not yet submitted to ETA
            </p>
          </div>
          <div className="rounded-lg border border-emerald-700/50 p-4 bg-emerald-500/5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium uppercase tracking-wider mb-2">
              <IcCheck className="h-4 w-4" />
              Accepted / Validated
            </div>
            <div className="text-2xl font-medium text-emerald-300">{accepted.length}</div>
            <p className="text-xs text-emerald-700/60 mt-1">
              ETA-compliant invoices
            </p>
          </div>
          <div className="rounded-lg border border-red-700/50 p-4 bg-red-500/5">
            <div className="flex items-center gap-2 text-red-400 text-xs font-medium uppercase tracking-wider mb-2">
              <IcAlert className="h-4 w-4" />
              Rejected / Issues
            </div>
            <div className="text-2xl font-medium text-red-300">{rejected.length}</div>
            <p className="text-xs text-red-400/70 mt-1">
              Requires attention
            </p>
          </div>
        </div>
      </Card>

      {/* Invoice list with ETA status */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Invoice ETA Status</h3>
          <Badge variant="outline" className="text-xs">
            {invoices.length} invoices
          </Badge>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <IcShield className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No invoices</h3>
            <p className="text-sm text-slate-400">
              ETA compliance data will appear once invoices are created.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>ETA Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 text-sm font-medium text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-300 font-mono text-xs">
                      {inv.order.orderNumber ?? "—"}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-white text-right">
                      EGP {inv.total.toLocaleString("en-EG", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={ETA_STATUS_TONE[inv.etaStatus] || "default"}
                        className="text-xs"
                      >
                        {ETA_STATUS_LABELS[inv.etaStatus] ?? inv.etaStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-400">
                      {inv.etaStatus !== "PENDING" && inv.etaStatus !== "REJECTED"
                        ? new Date(inv.createdAt).toLocaleDateString("en-EG")
                        : "—"}
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
