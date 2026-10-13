"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Truck, MapPin, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Package, Route, Navigation, Camera, DollarSign, Car,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { ShippingOnboardingBot } from "@/components/ai-assistant/shipping-onboarding-chatbot";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface Trip {
  id: string;
  tripNumber: string;
  status: string;
  driverName: string | null;
  vehiclePlate: string | null;
  scheduledDate: string | null;
  completedAt: string | null;
  stops: { hotel: { name: string } }[];
}

interface Vehicle {
  plate: string;
  drivers: string[];
  phones: string[];
  totalTrips: number;
  activeTrips: number;
  status: string;
  lastUsed: string | null;
}

interface EarningsSummary {
  totalTrips: number;
  totalStops: number;
  totalEarnings: number;
  averagePerTrip: number;
  period: string;
}

interface PodStop {
  id: string;
  stopNumber: number | null;
  status: string;
  actualArrival: string | null;
  hotel: { name: string };
  deliveryProofs: { id: string; createdAt: string }[];
}

// ── Status badge ──
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PENDING: { bg: "bg-surface-2", text: "text-foreground-muted", dot: "bg-surface-1", label: "Pending" },
    POD_CAPTURED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Proof Recorded" },
    SCHEDULED: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Scheduled" },
    PICKED_UP: { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400", label: "Picked Up" },
    LOADING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Loading" },
    IN_TRANSIT: { bg: "bg-accent-base/10", text: "text-accent-base", dot: "bg-accent-base", label: "In Transit" },
    ARRIVED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Arrived" },
    DELIVERED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Delivered" },
    DELAYED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Delayed" },
    RETURNING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Returning" },
    CANCELLED: { bg: "bg-surface-2", text: "text-foreground-muted", dot: "bg-surface-1", label: "Cancelled" },
    COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Completed" },
  };
  const c = config[status] || { bg: "bg-surface-2", text: "text-foreground-muted", dot: "bg-surface-1", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── Progress bar ──
function ShipmentProgress({ status }: { status: string }) {
  const progressMap: Record<string, number> = {
    SCHEDULED: 5, PICKED_UP: 15, LOADING: 25, IN_TRANSIT: 60,
    ARRIVED: 90, DELIVERED: 100, RETURNING: 100, DELAYED: 40,
    COMPLETED: 100, CANCELLED: 0,
  };
  const progress = progressMap[status] || 0;
  const color = progress >= 100 ? "var(--success)" : status === "DELAYED" ? "var(--error)" : progress > 50 ? "var(--accent-base)" : "var(--info)";
  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Skeleton ──
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4 animate-pulse">
      <div className="h-3 w-20 bg-surface-2 rounded mb-3" />
      <div className="h-6 w-24 bg-surface-2 rounded mb-2" />
      <div className="h-3 w-16 bg-surface-2 rounded" />
    </div>
  );
}

// ── Tab navigation ──
type Tab = "trips" | "fleet" | "earnings" | "pod";

export default function LogisticsPortalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("trips");
  const [podDialogOpen, setPodDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [proofStopId, setProofStopId] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofKey, setProofKey] = useState<string | null>(null);

  const { data: tripsData, loading: tripsLoading, error: tripsError } = useApi<{ trips: Trip[]; pagination: { total: number } }>(
    "/api/v1/shipping/trips?page=1&limit=20"
  );
  const { data: fleetData, loading: fleetLoading, error: fleetError } = useApi<Vehicle[]>("/api/v1/shipping/fleet");
  const { data: earningsData, loading: earningsLoading, error: earningsError } = useApi<{
    available: boolean;
    message?: string;
    summary: EarningsSummary | null;
    daily: { date: string; trips: number; stops: number; earnings: number }[];
    topVehicles: { plate: string; trips: number; earnings: number }[];
  }>("/api/v1/shipping/earnings?period=30d");
  const { data: podData, loading: podLoading, error: podError, refetch: refetchPod } = useApi<{
    stops: PodStop[]; message: string; submissionAvailable: boolean;
  }>(selectedTrip ? `/api/v1/shipping/pod?tripId=${encodeURIComponent(selectedTrip.id)}` : null);

  const trips = tripsData?.trips ?? [];
  const fleet = fleetData ?? [];
  const podTrips = trips;
  const submitProof = async () => {
    if (!proofPhoto || !proofStopId || !receivedBy.trim()) return;
    const key = proofKey || crypto.randomUUID();
    setProofKey(key); setProofError(null); setSubmittingProof(true);
    try {
      const form = new FormData();
      form.append("stopId", proofStopId); form.append("receivedBy", receivedBy.trim()); form.append("photo", proofPhoto);
      const response = await fetch("/api/v1/shipping/pod", { method: "POST", credentials: "include", headers: { "x-idempotency-key": key }, body: form });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Proof could not be recorded");
      setProofPhoto(null); setProofStopId(""); setReceivedBy(""); setProofKey(null); refetchPod();
    } catch (cause) { setProofError(cause instanceof Error ? cause.message : "Proof could not be recorded"); }
    finally { setSubmittingProof(false); }
  };

  const metrics = (() => {
    const active = trips.filter((t) => !["DELIVERED", "RETURNING", "CANCELLED", "COMPLETED"].includes(t.status)).length;
    const delivered = trips.filter((t) => t.status === "DELIVERED" || t.status === "COMPLETED").length;
    const earnings = earningsData?.summary;
    return [
      { label: "Active Trips", value: tripsError ? "—" : active.toString(), change: `${trips.length} loaded trips`, up: true, icon: Truck },
      { label: "Fleet Vehicles", value: fleetError ? "—" : fleet.length.toString(), change: "Recorded in trip history", up: true, icon: Route },
      { label: "Delivered", value: tripsError ? "—" : delivered.toString(), change: "Loaded trips", up: true, icon: CheckCircle2 },
      { label: "Revenue", value: earnings ? `EGP ${earnings.totalEarnings.toLocaleString()}` : "—", change: earnings ? `EGP ${earnings.averagePerTrip}/trip avg` : "Settlement data unavailable", up: true, icon: DollarSign },
    ];
  })();

  const tabs: { key: Tab; label: string; icon: typeof Truck }[] = [
    { key: "trips", label: "Trips", icon: Truck },
    { key: "fleet", label: "Fleet", icon: Car },
    { key: "earnings", label: "Earnings", icon: DollarSign },
    { key: "pod", label: "Proof of Delivery", icon: Camera },
  ];

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Logistics Command Center</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Fleet tracking, route optimization, and delivery management</p>
        </div>
      </motion.div>

      {(tripsError || fleetError || earningsError) && (
        <p role="alert" className="rounded-xl border border-red-500/30 p-4 text-sm text-red-300">
          {tripsError || fleetError || earningsError}
        </p>
      )}

      {/* Metrics */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <motion.div
            key={m.label}
            variants={fadeInUp}
            className="rounded-xl border border-border-subtle bg-surface-1 p-4 hover:bg-surface-1 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{m.label}</span>
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                <m.icon size={15} className="text-foreground-muted" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{m.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {m.up ? <ArrowUpRight size={12} className="text-emerald-400" /> : <ArrowDownRight size={12} className="text-red-400" />}
              <span className={`text-[11px] font-medium ${m.up ? "text-emerald-400" : "text-red-400"}`}>{m.change}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp} className="flex gap-1 p-1 rounded-xl bg-surface-1 border border-border-subtle w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-surface-2 text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground-tertiary hover:bg-surface-1"
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      {activeTab === "trips" && (
        <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Package size={14} className="text-foreground-muted" /> Active Trips
            </h3>
            {tripsLoading ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-surface-1 rounded-xl border border-border-invisible" />
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="rounded-xl border border-border-subtle bg-surface-1 p-8 text-center">
                <p className="text-sm text-foreground-muted">No trips scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => {
                  const destinations = trip.stops.map((s) => s.hotel.name).join(" → ");
                  return (
                    <div key={trip.id} className="rounded-xl border border-border-subtle bg-surface-1 p-4 hover:bg-surface-1 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono text-foreground-muted">{trip.tripNumber}</span>
                            <StatusBadge status={trip.status} />
                          </div>
                          <p className="text-xs font-medium text-white">{destinations || "Direct Delivery"}</p>
                          <p className="text-[11px] text-foreground-muted mt-0.5">Driver: {trip.driverName || "Not assigned"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-foreground-muted">Scheduled</p>
                          <p className="text-xs text-foreground-secondary">{trip.scheduledDate ? new Date(trip.scheduledDate).toLocaleDateString() : "Not scheduled"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-[10px] text-foreground-muted flex items-center gap-1"><Truck size={10} /> {trip.vehiclePlate || "Vehicle not assigned"}</span>
                        <span className="text-[10px] text-foreground-muted flex items-center gap-1"><Navigation size={10} /> {trip.driverName}</span>
                      </div>
                      <ShipmentProgress status={trip.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Truck size={14} className="text-foreground-muted" /> Fleet Status
              </h3>
              {fleetLoading ? (
                <div className="animate-pulse space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-surface-1 rounded-lg" />)}
                </div>
              ) : fleet.length === 0 ? (
                <p className="text-xs text-foreground-muted py-4 text-center">No vehicles active.</p>
              ) : (
                <div className="space-y-3">
                  {fleet.slice(0, 6).map((v) => (
                    <div key={v.plate} className="flex items-center justify-between p-3 rounded-lg border border-border-invisible hover:bg-surface-1 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${v.status === "ACTIVE" ? "bg-accent-base" : "bg-surface-2"}`} />
                        <div>
                          <p className="text-xs font-medium text-white">{v.plate}</p>
                          <p className="text-[10px] text-foreground-muted">{v.drivers.join(", ") || "No driver"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-foreground-muted">{v.totalTrips} trips</p>
                        <p className="text-[9px] text-foreground-muted">{v.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-foreground-muted" /> Live Routes
              </h3>
              <div className="aspect-video rounded-lg bg-surface-1 border border-border-invisible flex items-center justify-center">
                <div className="text-center">
                  <Route size={24} className="text-foreground-muted mx-auto mb-2" />
                  <p className="text-[11px] text-foreground-muted">Map integration coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "fleet" && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Car size={14} className="text-foreground-muted" /> Fleet Management
            </h3>
          </div>
          {fleetLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : fleet.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface-1 p-8 text-center">
              <Car size={32} className="text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground-muted">No vehicles registered yet.</p>
              <p className="text-xs text-foreground-muted mt-1">Vehicles appear here when trips are created.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {fleet.map((v) => (
                <div key={v.plate} className="rounded-xl border border-border-subtle bg-surface-1 p-4 hover:bg-surface-1 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${v.status === "ACTIVE" ? "bg-emerald-400" : "bg-surface-2"}`} />
                      <span className="text-sm font-semibold text-white">{v.plate}</span>
                    </div>
                    <StatusBadge status={v.status === "ACTIVE" ? "IN_TRANSIT" : "SCHEDULED"} />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Drivers</span>
                      <span className="text-foreground-secondary">{v.drivers.join(", ") || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Total Trips</span>
                      <span className="text-foreground-secondary">{v.totalTrips}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Active</span>
                      <span className="text-foreground-secondary">{v.activeTrips}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Last Used</span>
                      <span className="text-foreground-secondary">{v.lastUsed ? new Date(v.lastUsed).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "earnings" && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <DollarSign size={14} className="text-foreground-muted" /> Earnings Overview
          </h3>
          {earningsLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : earningsData?.available && earningsData.summary ? (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total Revenue", value: `EGP ${earningsData.summary.totalEarnings.toLocaleString()}` },
                  { label: "Completed Trips", value: earningsData.summary.totalTrips.toString() },
                  { label: "Total Stops", value: earningsData.summary.totalStops.toString() },
                  { label: "Avg per Trip", value: `EGP ${earningsData.summary.averagePerTrip.toLocaleString()}` },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                    <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-lg font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Top vehicles */}
              <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                <h4 className="text-xs font-semibold text-white mb-3">Top Performing Vehicles</h4>
                <div className="space-y-2">
                  {earningsData.topVehicles.map((v, i) => (
                    <div key={v.plate} className="flex items-center justify-between p-3 rounded-lg border border-border-invisible">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-foreground-muted font-mono w-4">#{i + 1}</span>
                        <span className="text-xs font-medium text-white">{v.plate}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-emerald-400">EGP {v.earnings.toLocaleString()}</p>
                        <p className="text-[10px] text-foreground-muted">{v.trips} trips</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily breakdown */}
              <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                <h4 className="text-xs font-semibold text-white mb-3">Daily Breakdown</h4>
                <div className="space-y-1">
                  {earningsData.daily.slice(0, 14).map((d) => (
                    <div key={d.date} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-1">
                      <span className="text-xs text-foreground-muted">{new Date(d.date).toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-foreground-muted">{d.trips} trips</span>
                        <span className="text-[10px] text-foreground-muted">{d.stops} stops</span>
                        <span className="text-xs font-semibold text-emerald-400">EGP {d.earnings.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border-subtle bg-surface-1 p-8 text-center">
              <DollarSign size={32} className="text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground-muted">{earningsData?.message || earningsError || "Earnings data could not be loaded."}</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "pod" && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Camera size={14} className="text-foreground-muted" /> Proof of Delivery
          </h3>
          {tripsLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : podTrips.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface-1 p-8 text-center">
              <Camera size={32} className="text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground-muted">{tripsError || "No trips available to review."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {podTrips.map((trip) => {
                const routeLabel = trip.stops.map((s) => s.hotel.name).join(" → ") || "Direct Delivery";
                return (
                  <div key={trip.id} className="rounded-xl border border-border-subtle bg-surface-1 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-white">Trip #{trip.id}</p>
                        <p className="text-xs text-foreground-muted">{routeLabel}</p>
                      </div>
                      <StatusBadge status={trip.status} />
                    </div>
                      <button
                        onClick={() => {
                          setSelectedTrip(trip);
                          setProofStopId(""); setProofPhoto(null); setReceivedBy(""); setProofError(null); setProofKey(null);
                          setPodDialogOpen(true);
                        }}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-accent-base/10 text-accent-base text-xs font-medium hover:bg-accent-base/20 transition-colors"
                      >
                        Review stop status
                      </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* POD Submission Dialog */}
          {podDialogOpen && selectedTrip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPodDialogOpen(false)}>
              <div role="dialog" aria-modal="true" aria-label="Delivery stop status" className="bg-surface-2 rounded-2xl border border-border-subtle p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h4 className="text-sm font-semibold text-white mb-4">Delivery stop status — {selectedTrip.tripNumber}</h4>
                <div className="space-y-3">
                  {podLoading ? <p className="text-sm text-foreground-muted">Loading stop status…</p> : podError ? <p role="alert" className="text-sm text-red-300">{podError}</p> : <>
                    <p className="text-sm text-foreground-muted">{podData?.message}</p>
                    {podData?.stops.map(stop => <div key={stop.id} className="flex justify-between gap-3 text-xs text-white"><span>{stop.hotel.name}</span><StatusBadge status={stop.status} />{stop.deliveryProofs.map(proof => <a key={proof.id} href={`/api/v1/shipping/proofs/${encodeURIComponent(proof.id)}`} target="_blank" rel="noreferrer" className="text-accent-base">View proof</a>)}</div>)}
                    {podData?.submissionAvailable && <form onSubmit={event => { event.preventDefault(); void submitProof(); }} className="space-y-3">
                      <label className="block text-xs text-white">Delivery stop<select required value={proofStopId} onChange={event => { setProofStopId(event.target.value); setProofKey(null); }} className="w-full bg-surface-1 p-2 rounded"><option value="">Select a pending stop</option>{podData.stops.filter(stop => ["PENDING", "ARRIVED"].includes(stop.status)).map(stop => <option key={stop.id} value={stop.id}>{stop.hotel.name}</option>)}</select></label>
                      <label className="block text-xs text-white">Received by<input required maxLength={150} value={receivedBy} onChange={event => { setReceivedBy(event.target.value); setProofKey(null); }} className="w-full bg-surface-1 p-2 rounded" /></label>
                      <label className="block text-xs text-white">Proof photo<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { setProofPhoto(event.target.files?.[0] || null); setProofKey(null); }} /></label>
                      <p className="text-xs text-foreground-muted">Only the assigned driver can record proof. Recording proof does not approve or complete the order.</p>
                      {proofError && <p role="alert" className="text-xs text-red-300">{proofError}</p>}
                      <button disabled={submittingProof || !proofStopId || !proofPhoto || !receivedBy.trim()} className="px-4 py-2 rounded-lg bg-accent-base text-white text-xs disabled:opacity-50">{submittingProof ? "Recording…" : "Record proof"}</button>
                    </form>}
                  </>}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { setPodDialogOpen(false); setSelectedTrip(null); }} className="flex-1 px-4 py-2 rounded-lg bg-surface-1 border border-border-subtle text-xs text-foreground-muted hover:text-foreground-secondary transition-colors">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Onboarding Chatbot */}
      <ShippingOnboardingBot />
    </motion.div>
  );
}
