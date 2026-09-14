"use client";

import { useState } from "react";

const BUDGET_LIMIT = 50000;

export function BudgetHealth() {
  const [spending, setSpending] = useState(32000);
  const [overrideTriggered, setOverrideTriggered] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const ratio = spending / BUDGET_LIMIT;
  const isOverLimit = ratio > 1;
  const remaining = Math.max(0, BUDGET_LIMIT - spending);

  const handleSlider = (val: number) => {
    setSpending(val);
    if (val > BUDGET_LIMIT) {
      setOverrideTriggered(true);
      setOverrideConfirmed(false);
    } else {
      setOverrideTriggered(false);
      setOverrideConfirmed(false);
    }
  };

  const handleConfirmOverride = () => {
    setOverrideConfirmed(true);
  };

  const statusColor = overrideConfirmed
    ? "#ce5112"
    : isOverLimit
    ? "#ce5112"
    : "#ce5112";

  const statusLabel = overrideConfirmed
    ? "OVERRIDDEN — DUAL KEY ACTIVE"
    : isOverLimit
    ? "BUDGET EXCEEDED"
    : "WITHIN BUDGET";

  return (
    <div>
      <p className="bento-label mb-3">OPERATIONAL BUDGETING</p>
      <p className="text-[#9a9696] text-xs font-light mb-4">
        Budget Health Indicator
      </p>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: statusColor }}
        />
        <span
          className="text-xs font-medium tracking-wider"
          style={{ color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      <div
        className="w-full h-2 rounded-full mb-1 overflow-hidden"
        style={{ background: "#181916" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(ratio * 100, 100)}%`,
            background: overrideConfirmed
              ? "#ce5112"
              : isOverLimit
              ? "#ce5112"
              : "#ce5112",
          }}
        />
      </div>

      <div className="flex justify-between text-xs mb-4">
        <span className="text-[#9a9696] font-light">
          EGP {spending.toLocaleString()} spent
        </span>
        <span className="text-[#9a9696] font-light">
          EGP {BUDGET_LIMIT.toLocaleString()} limit
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={70000}
        step={1000}
        value={spending}
        onChange={(e) => handleSlider(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-4"
        style={{ background: "#181916", accentColor: "#8c6c2c" }}
      />

      {overrideTriggered && !overrideConfirmed && (
        <div
          className="rounded-lg p-3 text-xs space-y-2 animate-fluid-fade"
          style={{ background: "rgba(200,92,17,0.10)", border: "1px solid rgba(200,92,17,0.25)" }}
        >
          <p className="text-[#ce5112] font-medium">
            Budget limit exceeded by EGP {(spending - BUDGET_LIMIT).toLocaleString()}
          </p>
          <p className="text-[#9a9696] font-light">
            Dual-authorization override required. Two admin keys needed.
          </p>
          <button
            onClick={handleConfirmOverride}
            className="w-full py-2 rounded-md text-xs font-medium transition-all"
            style={{ background: "#ce5112", color: "#ffffff" }}
          >
            Simulate Dual-Key Override
          </button>
        </div>
      )}

      {overrideConfirmed && (
        <div
          className="rounded-lg p-3 text-xs"
          style={{ background: "rgba(200,92,17,0.10)", border: "1px solid rgba(200,92,17,0.25)" }}
        >
          <p className="text-[#ce5112] font-medium">
            Override approved. {"{authMatrix: 0x" + Math.abs((spending * 9973) % 1000000).toString(16) + "}"}
          </p>
        </div>
      )}

      {!isOverLimit && (
        <p className="text-[#ce5112] text-xs font-light">
          Remaining budget: EGP {remaining.toLocaleString()}
        </p>
      )}
    </div>
  );
}
