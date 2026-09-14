"use client";

/* FeatureStrap — a thin flicker bar below the hero (and matching the header strap).
   Cycles the app's headline product features in gold text on the app-wide navy,
   as a full-bleed clean bar so it never overlaps any lower section/icons. */

import { useEffect, useState } from "react";

const LINES = [
  "Free to start — no subscription for hotels & suppliers",
  "48-hour early payout on approved orders",
  "Multi-tier approval matrix · budget locks · AI spend forecasting",
  "RFQ auctions & cross-supplier price comparison built in",
  "Dock camera GRN in the HOVIN app — instant credit notes",
  "ETA e-invoicing & e-waybill compliance, submission-ready",
];

export function FeatureStrap() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % LINES.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass-strap w-full">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-3 flex items-center justify-center text-center overflow-hidden" style={{ color: "#ffffff" }}>
        <span key={i} className="glass-strap-text text-[12px] font-semibold tracking-wide">
          {LINES[i]}
        </span>
      </div>
    </div>
  );
}