"use client";

import { useState } from "react";

const EGS_CATEGORIES = [
  { code: "101001", label: "Meat & Poultry" },
  { code: "102002", label: "Dairy Products" },
  { code: "103003", label: "Beverages" },
  { code: "201001", label: "Cleaning Supplies" },
  { code: "202002", label: "Linen & Textiles" },
];

function sha256(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export function ProxyTaxEngine() {
  const [selectedCode, setSelectedCode] = useState(EGS_CATEGORIES[0].code);
  const [amount, setAmount] = useState(15000);
  const [vatRate, setVatRate] = useState(14);

  const vatAmount = amount * (vatRate / 100);
  const proxyFee = amount * 0.0075;
  const total = amount + vatAmount + proxyFee;
  const etaUuid = sha256(`${selectedCode}-${amount}-${Date.now()}`);

  return (
    <div>
      <p className="bento-label mb-3">PROXY TAX INVOICING ENGINE</p>
      <p className="text-[#9a9696] text-xs font-light mb-4">
        EGS/GS1 Code Mapper & ETA Simulator
      </p>

      <div className="space-y-3">
        <div>
          <p className="text-[#9a9696] text-xs font-light mb-1">EGS Category Code</p>
          <div className="flex flex-wrap gap-1.5">
            {EGS_CATEGORIES.map((cat) => (
              <button
                key={cat.code}
                onClick={() => setSelectedCode(cat.code)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                  selectedCode === cat.code
                    ? "bg-[#8c6c2c] text-[#0f100e]"
                    : "bg-[#181916] text-[#9a9696] border border-[#22231f]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {cat.code}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[#9a9696] text-xs font-light mb-1">
            Invoice Amount: EGP {amount.toLocaleString()}
          </p>
          <input
            type="range"
            min={1000}
            max={100000}
            step={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: "#181916", accentColor: "#8c6c2c" }}
          />
        </div>

        <div>
          <p className="text-[#9a9696] text-xs font-light mb-1">VAT Rate: {vatRate}%</p>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: "#181916", accentColor: "#8c6c2c" }}
          />
        </div>

        <div
          className="rounded-lg p-3 mt-2 space-y-1"
          style={{ background: "#181916", border: "1px solid rgba(140,108,44,0.12)" }}
        >
          <div className="flex justify-between text-xs">
            <span className="text-[#9a9696] font-light">Subtotal</span>
            <span className="text-[#ffffff] font-medium">EGP {amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#9a9696] font-light">VAT ({vatRate}%)</span>
            <span className="text-[#ffffff] font-medium">EGP {vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#9a9696] font-light">Proxy Fee (0.75%)</span>
            <span className="text-[#a07d3c] font-medium">EGP {proxyFee.toFixed(2)}</span>
          </div>
          <div className="border-t pt-1 mt-1 flex justify-between text-xs" style={{ borderColor: "rgba(140,108,44,0.15)" }}>
            <span className="text-[#ffffff] font-medium">Total Payable</span>
            <span className="text-[#ffffff] font-medium">EGP {total.toFixed(2)}</span>
          </div>
        </div>

        <div
          className="rounded-lg p-2.5 text-xs font-mono truncate"
          style={{ background: "#0f100e", border: "1px solid rgba(140,108,44,0.10)" }}
        >
          <span className="text-[#9a9696] font-light">ETA UUID (DEMO): </span>
          <span className="text-[#8c6c2c] font-medium">{etaUuid}</span>
        </div>
        <p className="text-[10px] text-[#9a9696] font-light mt-1">⚠️ Simulated — not a real ETA UUID</p>
      </div>
    </div>
  );
}
