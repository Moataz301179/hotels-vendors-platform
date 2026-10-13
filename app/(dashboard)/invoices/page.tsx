// app/invoices/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge, Card, Skeleton, Button, Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui";
import { IcInvoice } from "@/components/icons";
import { StatCard } from "@/components/shared/stat-card";

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  hotelId: string;
  supplierId: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  issueDate: string;
  dueDate: string | null;
  status: string;
  paymentStatus: string;
  etaStatus: string;
  factoringStatus: string;
  createdAt: string;
  hotel: { id: string; name: string };
  supplier: { id: string; name: string };
  order: { id: string; orderNumber: string };
}

interface InvoicesResponse {
  invoices: Invoice[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  PAID: "Paid",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  OVERDUE: "Overdue",
  PENDING: "Pending",
};

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "error" | "outline"> = {
  DRAFT: "default",
  ISSUED: "outline",
  SUBMITTED: "warning",
  APPROVED: "success",
  PAID: "success",
  REJECTED: "error",
  CANCELLED: "error",
  OVERDUE: "error",
  PENDING: "warning",
};

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, loading, error, refetch } = useApi<InvoicesResponse>(`/api/v1/invoices?page=${page}&limit=${limit}`);
  const invoices = data?.invoices ?? [];
  const total = data?.pagination.total ?? 0;

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardShell role="hotel">
      <PageHeader
        title="Invoices"
        description="View and manage billing invoices for procurement orders"
        action={
          <Button size="sm" asChild>
            <Link href="/api/v1/invoices" download="invoices.json">Download JSON</Link>
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Invoices"
          value={total}
          icon={IcInvoice}
        />
        <StatCard
          title="Issued"
          value={invoices.filter((i) => i.status === "ISSUED").length}
          icon={IcInvoice}
        />
        <StatCard
          title="Approved"
          value={invoices.filter((i) => i.status === "APPROVED").length}
          icon={IcInvoice}
        />
        <StatCard
          title="Pending Payment"
          value={invoices.filter((i) => i.paymentStatus === "UNPAID").length}
          icon={IcInvoice}
        />
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
            </Card>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card className="p-12 text-center">
          <IcInvoice className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">No invoices yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            Invoices will appear here once procurement orders are billed.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href="/orders">Browse Orders</Link>
          </Button>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Supplier / Hotel</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{inv.invoiceNumber}</span>
                        <span className="text-xs text-slate-500">{inv.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-300 font-mono text-xs">
                      {inv.order.orderNumber ?? "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm text-white">{inv.supplier.name}</div>
                      <div className="text-xs text-slate-500">{inv.hotel.name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-sm font-medium text-white text-right">
                      EGP {inv.total.toLocaleString("en-EG", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={STATUS_TONE[inv.status] || "default"}
                        className="text-xs"
                      >
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-400">
                      {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("en-EG") : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-400">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-EG") : "—"}
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 gap-3">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} invoices
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-400 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
