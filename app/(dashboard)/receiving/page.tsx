// app/receiving/page.tsx
"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Skeleton, Input } from "@/components/ui";

interface GrnLineItem {
  id: string;
  orderItemId: string;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason: string | null;
  batchNumber: string | null;
  conditionNotes: string | null;
  product: { id: string; name: string; sku: string };
}

interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  status: string;
  orderId: string;
  hotelId: string;
  supplierId: string;
  warehouseLocation: string | null;
  deliveryNoteRef: string | null;
  vehiclePlate: string | null;
  notes: string | null;
  receivedById: string;
  receivedAt: string;
  createdAt: string;
  order: { id: string; orderNumber: string };
  hotel: { id: string; name: string };
  supplier: { id: string; name: string };
  lineItems: GrnLineItem[];
}

interface GrnResponse {
  grns: GoodsReceiptNote[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Fully Received",
  REJECTED: "Rejected",
  PARTIALLY_ACCEPTED: "Partially Received",
  DRAFT: "Draft",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
};

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "error" | "outline"> = {
  ACCEPTED: "success",
  REJECTED: "error",
  PARTIALLY_ACCEPTED: "warning",
  DRAFT: "default",
  PENDING: "warning",
  CONFIRMED: "outline",
};

export default function ReceivingPage() {
  const [grns, setGrns] = useState<GoodsReceiptNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const fetchGrns = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/grn?page=${p}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Failed to load receiving records");
      const data: GrnResponse = await res.json();
      setGrns(data.grns);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGrns(page); }, [page, search]);

  const accepted = grns.filter((g) => g.status === "ACCEPTED");
  const partial = grns.filter((g) => g.status === "PARTIALLY_ACCEPTED");
  const rejected = grns.filter((g) => g.status === "REJECTED");
  const pending = grns.filter((g) => ["PENDING", "DRAFT", "CONFIRMED"].includes(g.status));

  const totalReceivedQty = grns.reduce((s, g) =>
    s + g.lineItems.reduce((ls, li) => ls + li.acceptedQuantity, 0), 0
  );
  const totalOrderedQty = grns.reduce((s, g) =>
    s + g.lineItems.reduce((ls, li) => ls + li.orderedQuantity, 0), 0
  );
  const reconciliationRate = totalOrderedQty > 0
    ? Math.round((totalReceivedQty / totalOrderedQty) * 100)
    : 0;

  return (
    <DashboardShell role="hotel">
      <PageHeader
        title="Goods Receipt (GRN)"
        description="Manage receiving records and reconcile delivered goods against purchase orders"
        action={
          <div className="flex gap-2">
            <Input
              placeholder="Search GRN #..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              size="sm"
              className="w-44"
            />
          </div>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total GRNs" value={grns.length} icon={IcWarehouse} />
        <StatCard title="Fully Received" value={accepted.length} icon={IcCheck} />
        <StatCard title="Partial" value={partial.length} icon={IcClock} />
        <StatCard title="Reconciliation" value={`${reconciliationRate}%`} icon={IcBox} />
      </div>

      {/* Reconciliation bar */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Reconciliation Status
          </h3>
          <span className="text-xs text-slate-500">
            {totalReceivedQty.toLocaleString("en-EG")} of {totalOrderedQty.toLocaleString("en-EG")} units received
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-700/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${reconciliationRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>Pending: {pending.length}</span>
          <span>Partial: {partial.length}</span>
          <span>Rejected: {rejected.length}</span>
        </div>
      </Card>

      {error && (
        <Card className="p-4 mb-6 border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {/* GRN List */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Receiving Records</h3>
          <Badge variant="outline" className="text-xs">
            {grns.length} records
          </Badge>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : grns.length === 0 ? (
          <div className="p-12 text-center">
            <IcWarehouse className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No receiving records</h3>
            <p className="text-sm text-slate-400">
              Goods receipt notes will appear here when deliveries are received.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN #</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grns.map((grn) => {
                  const totalOrdered = grn.lineItems.reduce((s, li) => s + li.orderedQuantity, 0);
                  const totalAccepted = grn.lineItems.reduce((s, li) => s + li.acceptedQuantity, 0);
                  return (
                    <TableRow key={grn.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-medium text-white font-mono">
                          {grn.grnNumber}
                        </div>
                        {grn.vehiclePlate && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <IcTruck className="h-3 w-3" />
                            {grn.vehiclePlate}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-300 font-mono text-xs">
                        {grn.order.orderNumber ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-white">
                        {grn.supplier.name}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-300 text-center">
                        {grn.lineItems.length}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-white text-right">
                        {totalAccepted} / {totalOrdered}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={STATUS_TONE[grn.status] || "default"}
                          className="text-xs"
                        >
                          {STATUS_LABELS[grn.status] ?? grn.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-400">
                        {grn.receivedAt
                          ? new Date(grn.receivedAt).toLocaleString("en-EG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {grns.length > 0 && grns.length % limit === 0 && (
        <div className="flex items-center justify-between mt-4 gap-3">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * limit + 1}–{page * limit} of {grns.length} records
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
            <Button
              size="sm"
              variant="outline"
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
