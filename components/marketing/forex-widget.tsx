"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, TrendingDown, Globe } from "lucide-react";

const rates = [
  { label: "USD/EGP", value: "50.85", change: "-0.12", up: true, source: "CBE" },
  { label: "EUR/EGP", value: "54.20", change: "+0.34", up: true, source: "Market" },
  { label: "Inflation", value: "24.1%", change: "-0.8", up: false, source: "CAPMAS" },
  { label: "CBE Rate", value: "49.45", change: "-0.05", up: false, source: "CBE" },
];

export function ForexWidget() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-2xl p-4"
      style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Globe size={12} style={{ color: "var(--success)" }} />
        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Market Rates</span>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse ml-auto" style={{ backgroundColor: "var(--success)" }} />
      </div>
      <div className="space-y-2.5">
        {rates.map((rate) => (
          <div key={rate.label} className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-white/50">{rate.label}</span>
              <span className="text-[9px] text-white/20 ml-1.5">{rate.source}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-white/70">{rate.value}</span>
              <span className="text-[9px] flex items-center gap-0.5" style={{ color: rate.up ? "var(--success)" : "var(--error)" }}>
                {rate.up ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                {rate.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
