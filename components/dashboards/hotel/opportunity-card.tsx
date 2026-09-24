/**
 * Opportunity Card — Compact list item for hotel procurement opportunities.
 * Shows type, title, impact, confidence, status with color-coded badge.
 */

"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, AlertTriangle, Package, ShieldCheck, Link2, ShoppingCart, DollarSign, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HV_THEME } from "@/components/theme/tokens";

export interface OpportunityCardData {
  id: string;
  type: string;
  status: string;
  title: string;
  description?: string | null;
  potentialImpact?: number | null;
  confidence?: number | null;
  affectedCategory?: string | null;
  affectedSupplier?: { id: string; name: string } | null;
  createdAt: string;
}

// Opportunity type display config
const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PRICE_DRIFT: { label: "Price Drift", icon: TrendingUp, color: "#F59E0B" },
  SUPPLIER_CONCENTRATION: { label: "Concentration", icon: AlertTriangle, color: "#EF4444" },
  VOLUME_OPPORTUNITY: { label: "Volume", icon: Package, color: "#3B82F6" },
  ALTERNATIVE_SOURCE: { label: "Alt Source", icon: ShoppingCart, color: "#10B981" },
  MAVERICK_SPEND: { label: "Maverick", icon: DollarSign, color: "#F97316" },
  CONSOLIDATION: { label: "Consolidation", icon: Link2, color: "#8B5CF6" },
  CONTRACT_VIOLATION: { label: "Violation", icon: ShieldCheck, color: "#EC4899" },
  INVENTORY_LINKED: { label: "Inventory", icon: Warehouse, color: "#06B6D4" },
};

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  DETECTED: "#7A7A92",
  REVIEWING: "#3B82F6",
  RESEARCHING: "#8B5CF6",
  ACTION_READY: "#F59E0B",
  RFQ_SENT: "#06B6D4",
  APPROVED: "#10B981",
  EXECUTING: "#F97316",
  RESULT_PENDING: "#EC4899",
  VERIFIED: "#10B981",
  CLOSED: "#7A7A92",
};

export function OpportunityCard({ opportunity }: { opportunity: OpportunityCardData }) {
  const typeConfig = TYPE_CONFIG[opportunity.type] || { label: opportunity.type, icon: Package, color: "#7A7A92" };
  const TypeIcon = typeConfig.icon;
  const statusColor = STATUS_COLORS[opportunity.status] || "#7A7A92";

  return (
    <Link href={'/hotel/opportunities/' + opportunity.id}>
      <div
        className="group block rounded-lg border p-4 transition-all hover:border-white/20 cursor-pointer"
        style={{
          backgroundColor: HV_THEME.dark.surface,
          borderColor: HV_THEME.dark.border.visible,
        }}
      >
        <div className="flex items-start gap-4">
          {/* Type icon */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: typeConfig.color + '15' }}
          >
            <TypeIcon size={18} style={{ color: typeConfig.color }} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className="text-sm truncate"
                style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}
              >
                {opportunity.title}
              </h3>
              <Badge
                className="shrink-0 border"
                style={{
                  backgroundColor: statusColor + '15',
                  color: statusColor,
                  borderColor: statusColor + '33',
                  fontWeight: 400,
                  fontSize: "0.65rem",
                }}
              >
                {opportunity.status.replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-2">
              {/* Type label */}
              <span
                className="text-xs"
                style={{ color: typeConfig.color, fontWeight: 400 }}
              >
                {typeConfig.label}
              </span>

              {/* Separator */}
              <span style={{ color: HV_THEME.dark.border.visible }}>·</span>

              {/* Impact */}
              {opportunity.potentialImpact != null && (
                <>
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: HV_THEME.dark.accent.base, fontWeight: 400 }}
                  >
                    EGP {opportunity.potentialImpact.toLocaleString()}
                  </span>
                  <span style={{ color: HV_THEME.dark.border.visible }}>·</span>
                </>
              )}

              {/* Confidence */}
              {opportunity.confidence != null && (
                <>
                  <span
                    className="text-xs"
                    style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}
                  >
                    {(opportunity.confidence * 100).toFixed(0)}% conf.
                  </span>
                  <span style={{ color: HV_THEME.dark.border.visible }}>·</span>
                </>
              )}

              {/* Supplier */}
              {opportunity.affectedSupplier && (
                <span
                  className="text-xs truncate"
                  style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
                >
                  {opportunity.affectedSupplier.name}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={16} style={{ color: HV_THEME.dark.accent.base }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
