// app/deliveries/page.tsx
"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { IcTruck, IcClock, IcMapPin, IcCheck, IcAlert, IcMail } from "@/components/icons";
import { StatCard } from "@/components/shared/stat-card";

interface Shipment {
  id: string;
  orderNumber: string;
  providerId: string;
  providerName: string;
  destinationCity: string;
  service: "EXPRESS" | "REGULAR";
  stage: string;
  stageLabel: string;
  discountedTotal: number;
  standardTotal: number;
  savingsPercent: number;
  transitDays: number;
  waybillQr: string;
  parcels: number;
  weightKg: number;
  buyerId: string;
  supplierId: string;
  timeline?: Array<{
    stage: string;
    label: string;
    at: string;
    actor: string;
    note: string;
  }>;
}

interface ShipmentsResponse {
  shipments: Shipment[];
}

const STAGE_LABELS: Record<string, string> = {
  CREATED: "Created",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
  CANCELLED: "Cancelled",
};

const STAGE_TONE: Record<string, "default" | "success" | "warning" | "error" | "outline" | "info"> = {
  CREATED: "outline",
  PICKED_UP: "info",
  IN_TRANSIT: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  EXCEPTION: "error",
  CANCELLED: "error",
};

const SERVICE_LABELS: Record<string, string> = {
  EXPRESS: "Express",
  REGULAR: "Regular",
};

export default function DeliveriesPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/logistics/shipments", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load shipments");
      const data: ShipmentsResponse = await res.json();
      setShipments(data.shipments);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShipments(); }, []);

  const inTransit = shipments.filter((s) => ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"].includes(s.stage));
  const delivered = shipments.filter((s) => s.stage === "DELIVERED");
  const pending = shipments.filter((s) => s.stage === "CREATED");
  const exceptions = shipments.filter((s) => s.stage === "EXCEPTION");

  const onTimeRate = delivered.length > 0
    ? Math.round((delivered.filter((s) => s.stage === "DELIVERED").length / delivered.length) * 100)
    : 100;

  return (
    <DashboardShell role="shipping">
      <PageHeader
        title="Delivery Tracking"
        description="Track shipments, monitor carrier performance, and manage delivery exceptions"
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <StatCard title="Total Shipments" value={shipments.length} icon={IcTruck} />
        <StatCard title="In Transit" value={inTransit.length} icon={IcClock} iconColor="text-sky-400" />
        <StatCard title="Delivered" value={delivered.length} icon={IcCheck} iconColor="text-emerald-400" />
        <StatCard title="Pending" value={pending.length} icon={IcMail} iconColor="text-amber-400" />
        <StatCard title="On-Time Rate" value={`${onTimeRate}%`} icon={IcMapPin} iconColor="text-emerald-400" />
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {/* Exceptions alert */}
      {exceptions.length > 0 && (
        <Card className="p-4 mb-6 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-300 text-sm font-medium mb-2">
            <IcAlert className="h-4 w-4" />
            Delivery Exceptions
          </div>
          <p className="text-xs text-red-400/70">
            {exceptions.length} shipment(s) require immediate attention.
          </p>
        </Card>
      )}

      {/* Shipments table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Shipment Overview</h3>
          <Badge variant="outline" className="text-xs">
            {shipments.length} shipments
          </Badge>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center">
            <IcTruck className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No shipments yet</h3>
            <p className="text-sm text-slate-400">
              Shipments will appear here once orders are dispatched.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment ID</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Transit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-medium text-white font-mono">
                        {shipment.id}
                      </div>
                      {shipment.waybillQr && (
                        <div className="text-xs text-slate-500 mt-0.5 font-mono">
                          EWB-{shipment.waybillQr.slice(0, 12)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-300 font-mono text-xs">
                      {shipment.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm text-white">{shipment.providerName}</div>
                      <div className="text-xs text-slate-500">{shipment.providerId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-white">
                      <div className="flex items-center gap-1.5">
                        <IcMapPin className="h-3.5 w-3.5 text-slate-500" />
                        {shipment.destinationCity}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-xs">
                        {SERVICE_LABELS[shipment.service] ?? shipment.service}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={STAGE_TONE[shipment.stage] || "default"}
                        className="text-xs"
                      >
                        {STAGE_LABELS[shipment.stage] ?? shipment.stage}
                      </Badge>
                      {shipment.stageLabel && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {shipment.stageLabel}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-300 text-center">
                      {shipment.transitDays} days
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Savings summary */}
      {shipments.length > 0 && (
        <Card className="p-5 mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Logistics Savings
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-700/50 p-4 bg-white/5">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Standard Rate
              </div>
              <div className="text-xl font-medium text-white">
                EGP {shipments.reduce((s, sh) => s + sh.standardTotal, 0).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-700/50 p-4 bg-emerald-500/5">
              <div className="text-xs text-emerald-400 uppercase tracking-wider mb-1">
                Discounted Total
              </div>
              <div className="text-xl font-medium text-emerald-300">
                EGP {shipments.reduce((s, sh) => s + sh.discountedTotal, 0).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-lg border border-signal/30 p-4 bg-signal/5">
              <div className="text-xs text-signal uppercase tracking-wider mb-1">
                Total Savings
              </div>
              <div className="text-xl font-medium text-signal">
                EGP {shipments.reduce((s, sh) => s + (sh.standardTotal - sh.discountedTotal), 0).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Average {shipments.length > 0
                  ? Math.round(shipments.reduce((s, sh) => s + sh.savingsPercent, 0) / shipments.length)
                  : 0}% discount per shipment
              </div>
            </div>
          </div>
        </Card>
      )}
    </DashboardShell>
  );
}