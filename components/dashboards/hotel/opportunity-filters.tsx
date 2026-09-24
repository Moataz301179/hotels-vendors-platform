/**
 * Opportunity Filters — Filter bar with status, type, category multi-select + search input.
 */

"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HV_THEME } from "@/components/theme/tokens";

export interface OpportunityFiltersState {
  search: string;
  statuses: string[];
  types: string[];
  category: string;
}

const STATUS_OPTIONS = [
  { value: "DETECTED", label: "Detected", color: "#7A7A92" },
  { value: "REVIEWING", label: "Reviewing", color: "#3B82F6" },
  { value: "RESEARCHING", label: "Researching", color: "#8B5CF6" },
  { value: "ACTION_READY", label: "Action Ready", color: "#F59E0B" },
  { value: "RFQ_SENT", label: "RFQ Sent", color: "#06B6D4" },
  { value: "APPROVED", label: "Approved", color: "#10B981" },
  { value: "EXECUTING", label: "Executing", color: "#F97316" },
  { value: "RESULT_PENDING", label: "Pending Result", color: "#EC4899" },
  { value: "VERIFIED", label: "Verified", color: "#10B981" },
  { value: "CLOSED", label: "Closed", color: "#7A7A92" },
];

const TYPE_OPTIONS = [
  { value: "PRICE_DRIFT", label: "Price Drift" },
  { value: "SUPPLIER_CONCENTRATION", label: "Concentration" },
  { value: "VOLUME_OPPORTUNITY", label: "Volume" },
  { value: "ALTERNATIVE_SOURCE", label: "Alt Source" },
  { value: "MAVERICK_SPEND", label: "Maverick" },
  { value: "CONSOLIDATION", label: "Consolidation" },
  { value: "CONTRACT_VIOLATION", label: "Violation" },
  { value: "INVENTORY_LINKED", label: "Inventory" },
];

interface OpportunityFiltersProps {
  filters: OpportunityFiltersState;
  onChange: (filters: OpportunityFiltersState) => void;
}

export function OpportunityFilters({ filters, onChange }: OpportunityFiltersProps) {
  function toggleStatus(status: string) {
    const statuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses });
  }

  function toggleType(type: string) {
    const types = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onChange({ ...filters, types });
  }

  function clearFilters() {
    onChange({ search: "", statuses: [], types: [], category: "" });
  }

  const hasActiveFilters = filters.search || filters.statuses.length > 0 || filters.types.length > 0 || filters.category;

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: HV_THEME.dark.text.muted }}
        />
        <Input
          type="text"
          placeholder="Search opportunities..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9"
          style={{
            backgroundColor: HV_THEME.dark.surface,
            borderColor: HV_THEME.dark.border.visible,
            color: HV_THEME.dark.text.primary,
          }}
        />
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <span
          className="text-xs uppercase tracking-wider self-center mr-1"
          style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
        >
          Status:
        </span>
        {STATUS_OPTIONS.map((opt) => {
          const active = filters.statuses.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleStatus(opt.value)}
              className="rounded-full border px-2.5 py-0.5 text-xs transition-all"
              style={{
                backgroundColor: active ? `${opt.color}20` : HV_THEME.dark.surface,
                color: active ? opt.color : HV_THEME.dark.text.secondary,
                borderColor: active ? `${opt.color}40` : HV_THEME.dark.border.visible,
                fontWeight: 400,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Type pills */}
      <div className="flex flex-wrap gap-2">
        <span
          className="text-xs uppercase tracking-wider self-center mr-1"
          style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
        >
          Type:
        </span>
        {TYPE_OPTIONS.map((opt) => {
          const active = filters.types.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleType(opt.value)}
              className="rounded-full border px-2.5 py-0.5 text-xs transition-all"
              style={{
                backgroundColor: active ? `${HV_THEME.dark.accent.base}20` : HV_THEME.dark.surface,
                color: active ? HV_THEME.dark.accent.base : HV_THEME.dark.text.secondary,
                borderColor: active ? HV_THEME.dark.border.accent : HV_THEME.dark.border.visible,
                fontWeight: 400,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-2 text-xs"
            style={{ color: HV_THEME.dark.text.muted }}
          >
            <X size={12} className="mr-1" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

export { STATUS_OPTIONS, TYPE_OPTIONS };
