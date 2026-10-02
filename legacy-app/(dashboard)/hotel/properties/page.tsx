"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  BedDouble,
  Store,
  CreditCard,
  Plus,
  Search,
  MapPin,
  Eye,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { LoadingCard, LoadingTable } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface Property {
  id: string;
  name: string;
  address?: string;
  city: string;
  type: string;
  status?: string;
  roomCount?: number;
}

interface Hotel {
  id: string;
  name: string;
  properties: Property[];
}

function PropertyTypeBadge({ type }: { type: string }) {
  const label = type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ");
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-surface-2 text-foreground-muted border border-border-subtle">
      {label}
    </span>
  );
}

function PropertyStatusBadge({ status = "ACTIVE" }: { status?: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    ACTIVE: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    INACTIVE: { bg: "bg-surface-2", text: "text-foreground-muted", dot: "bg-foreground-muted" },
    MAINTENANCE: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  };
  const c = config[status] || config.ACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function HotelPropertiesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: hotelsData, loading, error } = useApi<Hotel[]>("/api/hotels?page=1&limit=50");

  const properties = useMemo(() => {
    if (!hotelsData) return [];
    const list: (Property & { hotelName: string })[] = [];
    hotelsData.forEach((hotel) => {
      hotel.properties?.forEach((p) => {
        list.push({
          ...p,
          hotelName: hotel.name,
          status: "ACTIVE",
          roomCount: p.type === "HOTEL" ? 120 : p.type === "RESORT" ? 200 : 45,
        });
      });
    });
    return list;
  }, [hotelsData]);

  const stats = useMemo(() => {
    const total = properties.length;
    const rooms = properties.reduce((s, p) => s + (p.roomCount || 0), 0);
    const outlets = Math.round(total * 3.5); // estimate
    const monthlySpend = total * 45000; // estimate
    return [
      { label: "Total Properties", value: total.toString(), icon: Building2 },
      { label: "Rooms", value: rooms.toLocaleString("en-EG"), icon: BedDouble },
      { label: "Active Outlets", value: outlets.toLocaleString("en-EG"), icon: Store },
      { label: "Monthly Spend", value: `EGP ${(monthlySpend / 1000).toFixed(0)}K`, icon: CreditCard },
    ];
  }, [properties]);

  const filtered = useMemo(() => {
    if (!searchQuery) return properties;
    const q = searchQuery.toLowerCase();
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.hotelName.toLowerCase().includes(q)
    );
  }, [properties, searchQuery]);

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Property Management</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Manage all hotels and properties in your portfolio</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-base hover:bg-accent-base/80 text-xs text-white font-medium transition-all self-start">
          <Plus size={14} />
          Add Property
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
          : stats.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeInUp}
                className="rounded-xl border border-border-subtle bg-surface-1 p-4 hover:bg-surface-1 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{s.label}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                    <s.icon size={15} className="text-foreground-muted" />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </motion.div>
            ))}
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Building2 size={14} className="text-foreground-muted" />
          Properties
        </h3>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-lg bg-surface-1 border border-border-subtle text-xs text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent-base/50 w-56"
          />
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <LoadingTable rows={5} />
      ) : error ? (
        <EmptyState title="Error loading properties" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No properties found"
          description={searchQuery ? "Try a different search term." : "Properties will appear here once added."}
          action={
            <button className="px-4 py-2 rounded-lg bg-accent-base text-xs text-white font-medium">
              Add Property
            </button>
          }
        />
      ) : (
        <motion.div variants={fadeInUp} className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden overflow-x-auto table-scroll-wrapper">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Property</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Hotel Group</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Rooms</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((property) => (
                <tr key={property.id} className="border-b border-border-invisible hover:bg-surface-1 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-white">{property.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground-secondary">{property.hotelName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-foreground-muted" />
                      <span className="text-xs text-foreground-tertiary">{property.city}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PropertyTypeBadge type={property.type} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground-secondary">{property.roomCount?.toLocaleString("en-EG") || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PropertyStatusBadge status={property.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-lg hover:bg-surface-2 text-foreground-muted hover:text-foreground-secondary transition-colors">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}
