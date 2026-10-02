"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, TrendingUp, TrendingDown, Minus, BedDouble, Droplets, AlertTriangle, BarChart3,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { LoadingCard } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface ConsumptionForecast {
  id: string;
  month: string;
  occupancyRate: number;
  avgDailyConsumption: number;
  totalConsumption: number;
  monthlyForecast: number;
  forecastAccuracy: number | null;
  consumptionPerRoom: number;
  consumptionPerOccupiedRoom: number;
  trendDirection: string;
  seasonalityFactor: number;
  product: { name: string; sku: string; category: string };
}

interface ConsumptionData {
  forecasts: ConsumptionForecast[];
  summary: {
    avgOccupancy: number;
    avgConsumptionPerRoom: number;
    avgForecastAccuracy: number;
    totalConsumption: number;
    topConsumingProducts: Array<{ name: string; consumption: number; category: string }>;
    occupancyCorrelation: number;
  };
}

function TrendIcon({ direction }: { direction: string }) {
  if (direction === "UP") return <TrendingUp size={14} className="text-emerald-400" />;
  if (direction === "DOWN") return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-foreground-muted" />;
}

function CorrelationBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 2;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-foreground-muted w-24 truncate">{label}</span>
      <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full bg-[#3a544a]/60 rounded-full" style={{ width: `${width}%` }} />
      </div>
      <span className="text-[11px] text-white font-medium w-16 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

export default function ConsumptionPage() {
  const { data, loading, error } = useApi<ConsumptionData>("/api/v1/hotel/consumption");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    if (!data?.forecasts) return [];
    const cats = new Set(data.forecasts.map((f) => f.product.category));
    return ["all", ...Array.from(cats)];
  }, [data]);

  const filteredForecasts = useMemo(() => {
    if (!data?.forecasts) return [];
    if (selectedCategory === "all") return data.forecasts;
    return data.forecasts.filter((f) => f.product.category === selectedCategory);
  }, [data, selectedCategory]);

  const monthlyOccupancy = useMemo(() => {
    if (!data?.forecasts) return [];
    const grouped = data.forecasts.reduce<Record<string, { occupancy: number; consumption: number; count: number }>>((acc, f) => {
      if (!acc[f.month]) acc[f.month] = { occupancy: 0, consumption: 0, count: 0 };
      acc[f.month].occupancy += f.occupancyRate;
      acc[f.month].consumption += f.totalConsumption;
      acc[f.month].count += 1;
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([month, v]) => ({
        month,
        occupancy: v.occupancy / v.count,
        consumption: v.consumption,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  const maxConsumption = Math.max(...monthlyOccupancy.map((m) => m.consumption), 1);

  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto">
        <EmptyState title="Error loading consumption data" description={error} />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold tracking-tight text-white">Consumption Analytics</h1>
        <p className="text-sm text-foreground-muted mt-0.5">Occupancy correlation, consumption rates, and forecasting accuracy</p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
          : [
              { label: "Avg Occupancy", value: `${(data?.summary?.avgOccupancy ?? 0).toFixed(1)}%`, icon: BedDouble, color: "text-indigo-400" },
              { label: "Consumption/Room", value: (data?.summary?.avgConsumptionPerRoom ?? 0).toFixed(2), icon: Droplets, color: "text-emerald-400" },
              { label: "Forecast Accuracy", value: `${(data?.summary?.avgForecastAccuracy ?? 0).toFixed(1)}%`, icon: Activity, color: "text-amber-400" },
              { label: "Occupancy Correlation", value: (data?.summary?.occupancyCorrelation ?? 0).toFixed(2), icon: BarChart3, color: "text-cyan-400" },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeInUp}
                className="rounded-xl border border-border-subtle bg-surface-1 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{s.label}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                    <s.icon size={15} className={s.color} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </motion.div>
            ))}
      </motion.div>

      {/* Occupancy vs Consumption Chart */}
      <motion.div variants={fadeInUp} className="rounded-xl border border-border-subtle bg-surface-1 p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
          <BarChart3 size={14} className="text-foreground-muted" />
          Occupancy vs Consumption by Month
        </h3>
        {loading ? (
          <div className="h-48 flex items-center justify-center"><LoadingCard /></div>
        ) : monthlyOccupancy.length === 0 ? (
          <EmptyState title="No data" description="No consumption data available" />
        ) : (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-6 text-[11px]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#3a544a]/60" /><span className="text-foreground-muted">Consumption</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500/60" /><span className="text-foreground-muted">Occupancy %</span></div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-2 h-48">
              {monthlyOccupancy.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-0.5" style={{ height: 160 }}>
                    <div
                      className="w-3 rounded-t bg-[#3a544a]/60 hover:bg-[#3a544a]/80 transition-colors"
                      style={{ height: `${(m.consumption / maxConsumption) * 100}%` }}
                      title={`Consumption: ${m.consumption.toLocaleString()}`}
                    />
                    <div
                      className="w-3 rounded-t bg-emerald-500/60 hover:bg-emerald-500/80 transition-colors"
                      style={{ height: `${m.occupancy}%` }}
                      title={`Occupancy: ${m.occupancy.toFixed(1)}%`}
                    />
                  </div>
                  <span className="text-[9px] text-foreground-muted">{m.month.split("-")[1]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Forecast Accuracy */}
        <motion.div variants={fadeInUp} className="rounded-xl border border-border-subtle bg-surface-1 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Forecast Accuracy by Product</h3>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <LoadingCard key={i} />)}</div>
          ) : filteredForecasts.length === 0 ? (
            <EmptyState title="No forecasts" description="No forecast data available" />
          ) : (
            <div className="space-y-3">
              {filteredForecasts.slice(0, 10).map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{f.product.name}</p>
                    <p className="text-[10px] text-foreground-muted">{f.product.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendIcon direction={f.trendDirection} />
                    <span className={`text-xs font-medium ${
                      (f.forecastAccuracy ?? 0) > 90 ? "text-emerald-400" :
                      (f.forecastAccuracy ?? 0) > 70 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {f.forecastAccuracy?.toFixed(1) ?? "N/A"}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Consuming Products */}
        <motion.div variants={fadeInUp} className="rounded-xl border border-border-subtle bg-surface-1 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Consuming Products</h3>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <LoadingCard key={i} />)}</div>
          ) : !data?.summary?.topConsumingProducts?.length ? (
            <EmptyState title="No data" description="No consumption data available" />
          ) : (
            <div className="space-y-3">
              {data.summary.topConsumingProducts.map((p, i) => (
                <CorrelationBar
                  key={i}
                  label={p.name}
                  value={p.consumption}
                  max={data.summary.topConsumingProducts[0]?.consumption ?? 1}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Category Filter */}
      <motion.div variants={fadeInUp} className="rounded-xl border border-border-subtle bg-surface-1 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Consumption Details</h3>
          <div className="flex gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-[11px] rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#314B43] text-white"
                    : "bg-surface-2 text-foreground-muted hover:text-white"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <LoadingCard key={i} />)}</div>
        ) : filteredForecasts.length === 0 ? (
          <EmptyState title="No data" description="No consumption records found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-3 text-foreground-muted font-medium">Product</th>
                  <th className="text-left py-2 px-3 text-foreground-muted font-medium">SKU</th>
                  <th className="text-right py-2 px-3 text-foreground-muted font-medium">Avg Daily</th>
                  <th className="text-right py-2 px-3 text-foreground-muted font-medium">Per Room</th>
                  <th className="text-right py-2 px-3 text-foreground-muted font-medium">Per Occupied</th>
                  <th className="text-right py-2 px-3 text-foreground-muted font-medium">Occupancy</th>
                  <th className="text-center py-2 px-3 text-foreground-muted font-medium">Trend</th>
                  <th className="text-right py-2 px-3 text-foreground-muted font-medium">Seasonality</th>
                </tr>
              </thead>
              <tbody>
                {filteredForecasts.map((f) => (
                  <tr key={f.id} className="border-b border-border-invisible hover:bg-surface-2 transition-colors">
                    <td className="py-2.5 px-3 text-white font-medium">{f.product.name}</td>
                    <td className="py-2.5 px-3 text-foreground-muted">{f.product.sku}</td>
                    <td className="py-2.5 px-3 text-white text-right">{f.avgDailyConsumption.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-white text-right">{f.consumptionPerRoom.toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-white text-right">{f.consumptionPerOccupiedRoom.toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-white text-right">{f.occupancyRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-center"><TrendIcon direction={f.trendDirection} /></td>
                    <td className="py-2.5 px-3 text-white text-right">{f.seasonalityFactor.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
