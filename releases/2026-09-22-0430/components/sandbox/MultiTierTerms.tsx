"use client";

import { useState } from "react";

const BASE_PRICE = 100;
const TERM_OPTIONS = [
  { days: 30, discount: 0, label: "30 Days" },
  { days: 45, discount: 3, label: "45 Days" },
  { days: 60, discount: 5, label: "60 Days" },
  { days: 90, discount: 8, label: "90 Days" },
];

export function MultiTierTerms() {
  const [termIndex, setTermIndex] = useState(1);
  const [volume, setVolume] = useState(500);

  const term = TERM_OPTIONS[termIndex];
  const discount = term.discount;
  const volumeDiscount = volume >= 1000 ? 2 : volume >= 500 ? 1 : 0;
  const totalDiscount = discount + volumeDiscount;
  const adjustedPrice = BASE_PRICE * (1 - totalDiscount / 100);
  const totalCost = adjustedPrice * volume;

  return (
    <div>
      <p className="bento-label mb-3">MULTI-TIER TERMS MATRIX</p>
      <p className="text-[#9a9696] text-xs font-light mb-4">
        Term Selection Slider
      </p>

      <div className="flex gap-1.5 mb-4">
        {TERM_OPTIONS.map((opt, i) => (
          <button
            key={opt.days}
            onClick={() => setTermIndex(i)}
            className={`flex-1 py-2 text-xs rounded-md transition-all ${
              termIndex === i
                ? "bg-[#8c6c2c] text-[#0f100e]"
                : "bg-[#181916] text-[#9a9696] border border-[#22231f]"
            }`}
            style={{ fontWeight: 500 }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-[#9a9696] text-xs font-light mb-1">
          Volume: {volume} units
        </p>
        <input
          type="range"
          min={100}
          max={5000}
          step={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ background: "#181916", accentColor: "#8c6c2c" }}
        />
      </div>

      <div
        className="rounded-lg p-3 space-y-1.5"
        style={{ background: "#181916", border: "1px solid rgba(140,108,44,0.12)" }}
      >
        <div className="flex justify-between text-xs">
          <span className="text-[#9a9696] font-light">Base unit price</span>
          <span className="text-[#ffffff] font-medium">EGP {BASE_PRICE.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#9a9696] font-light">Term discount ({term.days}d)</span>
          <span className="text-[#a07d3c] font-medium">-{discount}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#9a9696] font-light">Volume discount</span>
          <span className="text-[#a07d3c] font-medium">-{volumeDiscount}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#9a9696] font-light">Total discount</span>
          <span className="text-[#a07d3c] font-medium">{totalDiscount}%</span>
        </div>
        <div className="border-t pt-1.5 mt-1.5 space-y-1" style={{ borderColor: "rgba(140,108,44,0.15)" }}>
          <div className="flex justify-between text-xs">
            <span className="text-[#ffffff] font-medium">Adjusted unit price</span>
            <span className="text-[#ffffff] font-medium">EGP {adjustedPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#ffffff] font-medium">Total cost ({volume} units)</span>
            <span className="text-[#8c6c2c] font-medium">EGP {totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
