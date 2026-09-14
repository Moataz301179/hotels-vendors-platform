"use client";

import { useState } from "react";
import {
  Truck,
  MapPin,
  Package,
  Route,
  Wrench,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useApi, usePost } from "@/lib/hooks/use-api";

/* ── Types ─────────────────────────────────────────────────────────────── */

type ShipmentStage =
  | "CREATED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "ARRIVED_DOCK"
  | "GOODS_RECEIVED"
  | "COMPLETED"
  | "EXCEPTION"
  | "RETURNING";

interface Shipment {
  id: string;
  orderNumber: string;
  providerId: string;
  providerName: string;
  destinationCity: string;
  service: "EXPRESS" | "REGULAR";
  discountedTotal: number;
  standardTotal: number;
  savingsPercent: number;
  parcels: number;
  weightKg: number;
  buyerId: string;
  supplierId: string;
  waybillQr?: string;
  stage?: ShipmentStage;
  stageLabel?: string;
  timeline?: unknown[];
}

interface Provider {
  id: string;
  name: string;
  type: "last_mile" | "freight" | "aggregator";
  deliveryTypes: ("express" | "regular")[];
  coverage: string[];
  connected: boolean;
  apiBaseUrl?: string;
}

interface Quote {
  mode: "quote";
  arbitrated?: {
    provider: string;
    service: string;
    ratePerParcel: number;
    ratePerKg: number;
    discountedTotal: number;
    standardTotal: number;
    savingsPercent: number;
    transitDays: number[];
  };
  single?: {
    provider: string;
    service: string;
    discountedTotal: number;
    transitDays: number[];
  };
  connected?: string[];
}

/* ── Stage-status pill ─────────────────────────────────────────────────── */

const STAGE_PILL: Record<ShipmentStage, { bg: string; label: string }> = {
  CREATED: { bg: "bg-[#314B43]", label: "Created" },
  PICKUP_SCHEDULED: { bg: "bg-amber-500", label: "Pickup Scheduled" },
  PICKED_UP: { bg: "bg-[#314B43]", label: "Picked Up" },
  IN_TRANSIT: { bg: "bg-[#314B43]", label: "In Transit" },
  ARRIVED_DOCK: { bg: "bg-amber-500", label: "Arrived at Dock" },
  GOODS_RECEIVED: { bg: "bg-emerald-600", label: "Goods Received" },
  COMPLETED: { bg: "bg-emerald-600", label: "Completed" },
  EXCEPTION: { bg: "bg-amber-500", label: "Exception" },
  RETURNING: { bg: "bg-amber-500", label: "Returning" },
};

function StagePill({ stage }: { stage?: ShipmentStage }) {
  const cfg = STAGE_PILL[stage ?? "CREATED"] ?? STAGE_PILL.CREATED;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${cfg.bg}`}
    >
      {cfg.label}
    </span>
  );
}

/* ── Skeleton / empty / error helpers ─────────────────────────────────── */

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-rose-50 p-4">
      <p className="text-sm text-rose-700">Failed to load: {message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

/* ── Form field helper ────────────────────────────────────────────────── */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#314B43] focus:outline-none focus:ring-1 focus:ring-[#314B43]";

/* ── Page ─────────────────────────────────────────────────────────────── */

interface BookForm {
  orderNumber: string;
  to: string;
  service: "EXPRESS" | "REGULAR";
  parcels: string;
  weightKg: string;
}

const INITIAL_FORM: BookForm = {
  orderNumber: "",
  to: "Cairo",
  service: "REGULAR",
  parcels: "1",
  weightKg: "1",
};

export default function CarrierFleetPage() {
  const [bookOpen, setBookOpen] = useState(false);
  const [form, setForm] = useState<BookForm>(INITIAL_FORM);
  const [bookError, setBookError] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);

  const shipments = useApi<{ shipments: Shipment[] }>("/api/v1/logistics/shipments");
  const providers = useApi<{ providers: Provider[] }>("/api/v1/logistics/providers");
  const expressQuote = useApi<Quote>(
    "/api/v1/logistics/providers?mode=quote&to=Cairo&parcels=1&weight=1&service=EXPRESS"
  );
  const regularQuote = useApi<Quote>(
    "/api/v1/logistics/providers?mode=quote&to=Cairo&parcels=1&weight=1&service=REGULAR"
  );

  const { post, loading: booking, error: postError } = usePost<
    { shipmentId: string; orderNumber: string; service: string },
    { orderNumber: string; to: string; service: string; parcels: string; weightKg: string }
  >("/api/v1/logistics/shipments");

  const list = shipments.data?.shipments ?? [];
  const providerList = providers.data?.providers ?? [];
  const connectedCount = providerList.filter((p) => p.connected).length;

  const express = expressQuote.data?.arbitrated;
  const regular = regularQuote.data?.arbitrated;

  const handleBook = async () => {
    setBookError(null);
    setBooked(null);
    try {
      const res = await post({
        orderNumber: form.orderNumber,
        to: form.to,
        service: form.service,
        parcels: form.parcels,
        weightKg: form.weightKg,
      });
      setBooked(res?.shipmentId ?? "Booked");
      setForm(INITIAL_FORM);
      setBookOpen(false);
      shipments.refetch();
    } catch (e) {
      setBookError(e instanceof Error ? e.message : "Booking failed");
    }
  };

  const hasLoadError =
    shipments.error || providers.error || expressQuote.error || regularQuote.error;

  return (
    <div className="min-h-[calc(100vh-8rem)] space-y-6 bg-[#F8FAFC] p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Truck size={22} className="text-[#314B43]" />
            Carrier Fleet Operations
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Live shipments, provider connections, and corridor pricing
          </p>
        </div>
        <button
          onClick={() => {
            setBookOpen((v) => !v);
            setBooked(null);
            setBookError(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#314B43] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3a544a]"
        >
          <Plus size={16} /> Book Shipment
        </button>
      </div>

      {/* Inline load errors */}
      {hasLoadError && (
        <InlineError
          message={
            shipments.error ||
            providers.error ||
            expressQuote.error ||
            regularQuote.error ||
            "Unknown error"
          }
          onRetry={() => {
            shipments.refetch();
            providers.refetch();
            expressQuote.refetch();
            regularQuote.refetch();
          }}
        />
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Live Shipments", value: list.length.toString(), icon: Route },
          { label: "Providers", value: providerList.length.toString(), icon: Truck },
          {
            label: "API Keys Connected",
            value: `${connectedCount}/${providerList.length}`,
            icon: Wrench,
          },
          {
            label: "Best Express Rate",
            value: express ? `EGP ${express.discountedTotal}` : "—",
            icon: Package,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {m.label}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ABA294]">
                <m.icon size={16} className="text-[#314B43]" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Book Shipment inline form */}
      {bookOpen && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Package size={16} className="text-[#314B43]" /> New Shipment
            </h2>
            <button
              onClick={() => setBookOpen(false)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close booking form"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Order Number">
              <input
                className={inputCls}
                placeholder="ORD-2026-00123"
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
              />
            </Field>
            <Field label="To (City)">
              <input
                className={inputCls}
                placeholder="Cairo"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
            </Field>
            <Field label="Service">
              <select
                className={inputCls}
                value={form.service}
                onChange={(e) =>
                  setForm({
                    ...form,
                    service: e.target.value as "EXPRESS" | "REGULAR",
                  })
                }
              >
                <option value="REGULAR">Regular</option>
                <option value="EXPRESS">Express</option>
              </select>
            </Field>
            <Field label="Parcels">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={form.parcels}
                onChange={(e) => setForm({ ...form, parcels: e.target.value })}
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                min={1}
                step="0.5"
                className={inputCls}
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
            </Field>
          </div>
          {(bookError || postError) && (
            <p className="mt-4 text-sm text-rose-600">
              {(bookError || postError || "Booking failed").toString()}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleBook}
              disabled={booking}
              className="inline-flex items-center gap-2 rounded-lg bg-[#314B43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a544a] disabled:opacity-50"
            >
              {booking ? "Booking…" : "Confirm Booking"}
            </button>
            <button
              onClick={() => setBookOpen(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
          {booked && (
            <p className="mt-3 text-sm font-medium text-emerald-700">
              Shipment {booked} booked successfully.
            </p>
          )}
        </div>
      )}

      {/* Live Shipments table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Route size={16} className="text-[#314B43]" /> Live Shipments
          </h2>
          <button
            onClick={() => shipments.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        {shipments.loading ? (
          <TableSkeleton />
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
            <Package size={32} className="mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">No shipments yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Book a shipment to start tracking it live.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">Shipment ID</th>
                  <th className="py-2.5 pr-4 font-medium">Order</th>
                  <th className="py-2.5 pr-4 font-medium">Provider</th>
                  <th className="py-2.5 pr-4 font-medium">Destination City</th>
                  <th className="py-2.5 pr-4 font-medium">Stage</th>
                  <th className="py-2.5 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs font-medium text-slate-900">
                      {s.id}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-700">
                      {s.orderNumber}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Truck size={13} className="text-slate-400" />
                        {s.providerName}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <MapPin size={13} className="text-slate-400" />
                        {s.destinationCity}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <StagePill stage={s.stage} />
                    </td>
                    <td className="py-3 text-slate-500">
                      {s.standardTotal > 0
                        ? `EGP ${s.discountedTotal.toLocaleString()} (est.)`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom grid: providers + service levels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Carrier Providers */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Truck size={16} className="text-[#314B43]" /> Carrier Providers
          </h2>
          {providers.loading ? (
            <TableSkeleton rows={4} />
          ) : providerList.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No providers registered.
            </p>
          ) : (
            <div className="space-y-2">
              {providerList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                      <Truck size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {p.deliveryTypes
                          .map((d) => d[0].toUpperCase() + d.slice(1))
                          .join(" · ")}
                        {" · "}
                        {p.coverage.length > 0 ? p.coverage[0] : "—"}
                        {p.coverage.length > 1 ? ` +${p.coverage.length - 1}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      p.connected
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        p.connected ? "bg-emerald-600" : "bg-amber-500"
                      }`}
                    />
                    {p.connected ? "Connected" : "Key Not Set"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Levels */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Route size={16} className="text-[#314B43]" /> Service Levels
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Best arbitrated rate for a sample corridor (Cairo, 1 parcel / 1 kg).
          </p>
          {expressQuote.loading || regularQuote.loading ? (
            <TableSkeleton rows={2} />
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: "Express",
                  q: express,
                  tone: express ? "bg-[#ABA294] text-[#4D4A46]" : "",
                },
                {
                  label: "Regular",
                  q: regular,
                  tone: regular ? "bg-emerald-50 text-emerald-700" : "",
                },
              ].map(({ label, q, tone }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-[11px] text-slate-500">
                      {q
                        ? `${q.provider} · ${q.transitDays?.[0] ?? "—"}-day transit`
                        : "No quote available"}
                    </p>
                  </div>
                  {q && (
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tone}`}>
                        EGP {q.discountedTotal.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        was EGP {q.standardTotal.toLocaleString()} · save{" "}
                        {q.savingsPercent}%
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}