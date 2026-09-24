/**
 * Opportunity Detail Page — Full view of a single procurement opportunity.
 * Shows evidence, baseline, current value, potential impact, actions, and status timeline.
 */

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  TrendingUp,
  AlertTriangle,
  Package,
  ShieldCheck,
  Link2,
  ShoppingCart,
  DollarSign,
  Warehouse,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { HV_THEME } from "@/components/theme/tokens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OpportunityDetail {
  id: string;
  type: string;
  status: string;
  title: string;
  description?: string | null;
  evidence?: Record<string, unknown> | null;
  baseline?: number | null;
  currentValue?: number | null;
  potentialImpact?: number | null;
  confidence?: number | null;
  recommendedAction?: string | null;
  affectedCategory?: string | null;
  affectedSupplierId?: string | null;
  affectedSupplier?: { id: string; name: string } | null;
  affectedProduct?: { id: string; name: string; sku?: string } | null;
  owner?: { id: string; name: string; email: string } | null;
  resultingTransactionId?: string | null;
  realizedResult?: Record<string, unknown> | null;
  verificationState?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  opportunity: OpportunityDetail;
}

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

// Status progression timeline order
const STATUS_FLOW = [
  "DETECTED",
  "REVIEWING",
  "RESEARCHING",
  "ACTION_READY",
  "RFQ_SENT",
  "APPROVED",
  "EXECUTING",
  "RESULT_PENDING",
  "VERIFIED",
  "CLOSED",
];

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, loading, refetch } = useApi<ApiResponse>(id ? `/api/v1/opportunities/${id}` : null);
  const opportunity = data?.opportunity;

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      let status = "";
      switch (action) {
        case "review":
          status = "REVIEWING";
          break;
        case "rfq":
          status = "RFQ_SENT";
          break;
        case "approve":
          status = "APPROVED";
          break;
        case "dismiss":
          status = "CLOSED";
          break;
      }

      if (!status) return;

      const res = await fetch(`/api/v1/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        refetch();
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: HV_THEME.dark.background }}>
        <Loader2 size={24} className="animate-spin" style={{ color: HV_THEME.dark.accent.base }} />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: HV_THEME.dark.background }}>
        <div className="text-center">
          <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: HV_THEME.dark.text.muted }} />
          <h2 className="text-lg" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
            Opportunity not found
          </h2>
          <Button variant="ghost" onClick={() => router.push("/hotel/opportunities")} className="mt-4">
            Back to Inbox
          </Button>
        </div>
      </div>
    );
  }

  const typeConfig = TYPE_CONFIG[opportunity.type] || { label: opportunity.type, icon: Package, color: "#7A7A92" };
  const TypeIcon = typeConfig.icon;
  const statusColor = STATUS_COLORS[opportunity.status] || "#7A7A92";
  const currentStatusIndex = STATUS_FLOW.indexOf(opportunity.status);

  return (
    <div className="min-h-screen" style={{ backgroundColor: HV_THEME.dark.background }}>
      {/* Header */}
      <div
        className="border-b px-[--hv-px] py-6"
        style={{
          backgroundColor: HV_THEME.dark.surface,
          borderBottomColor: HV_THEME.dark.border.visible,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: HV_THEME.layout.containerMax }}>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/hotel/opportunities")}
              className="h-8 w-8"
              style={{ color: HV_THEME.dark.text.secondary }}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{ backgroundColor: `${typeConfig.color}15` }}
              >
                <TypeIcon size={16} style={{ color: typeConfig.color }} />
              </div>
              <span className="text-xs" style={{ color: typeConfig.color, fontWeight: 400 }}>
                {typeConfig.label}
              </span>
            </div>
            <Badge
              className="ml-2 border"
              style={{
                backgroundColor: `${statusColor}15`,
                color: statusColor,
                borderColor: `${statusColor}33`,
                fontWeight: 400,
                fontSize: "0.7rem",
              }}
            >
              {opportunity.status.replace(/_/g, " ")}
            </Badge>
          </div>

          <h1
            className="text-xl mb-2"
            style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}
          >
            {opportunity.title}
          </h1>
          {opportunity.description && (
            <p
              className="text-sm"
              style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}
            >
              {opportunity.description}
            </p>
          )}

          {/* Value metrics */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {opportunity.baseline != null && (
              <div
                className="rounded-lg border p-3"
                style={{ backgroundColor: HV_THEME.dark.background, borderColor: HV_THEME.dark.border.visible }}
              >
                <span className="text-xs block" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  Baseline
                </span>
                <span className="text-sm mt-0.5 block tabular-nums" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
                  EGP {opportunity.baseline.toLocaleString()}
                </span>
              </div>
            )}
            {opportunity.currentValue != null && (
              <div
                className="rounded-lg border p-3"
                style={{ backgroundColor: HV_THEME.dark.background, borderColor: HV_THEME.dark.border.visible }}
              >
                <span className="text-xs block" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  Current Value
                </span>
                <span className="text-sm mt-0.5 block tabular-nums" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
                  EGP {opportunity.currentValue.toLocaleString()}
                </span>
              </div>
            )}
            {opportunity.potentialImpact != null && (
              <div
                className="rounded-lg border p-3"
                style={{ backgroundColor: HV_THEME.dark.background, borderColor: HV_THEME.dark.border.accent }}
              >
                <span className="text-xs block" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  Potential Impact
                </span>
                <span className="text-sm mt-0.5 block tabular-nums" style={{ color: HV_THEME.dark.accent.base, fontWeight: 400 }}>
                  EGP {opportunity.potentialImpact.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto px-[--hv-px] py-6" style={{ maxWidth: HV_THEME.layout.containerMax }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} style={{ color: HV_THEME.dark.text.muted }} />
                <span className="text-xs uppercase tracking-wider" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  Status Timeline
                </span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {STATUS_FLOW.map((status, i) => {
                  const isCompleted = i <= currentStatusIndex;
                  const isCurrent = i === currentStatusIndex;
                  const color = isCompleted ? statusColor : HV_THEME.dark.text.muted;
                  return (
                    <div key={status} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: isCompleted ? color : HV_THEME.dark.border.visible,
                            border: isCurrent ? `2px solid ${color}` : "none",
                          }}
                        />
                        <span
                          className="text-[10px] mt-1 whitespace-nowrap"
                          style={{ color: isCurrent ? color : HV_THEME.dark.text.muted, fontWeight: 400 }}
                        >
                          {status.replace(/_/g, " ")}
                        </span>
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div
                          className="h-[2px] w-6 mx-1"
                          style={{
                            backgroundColor: i < currentStatusIndex ? statusColor : HV_THEME.dark.border.visible,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evidence */}
            {opportunity.evidence && Object.keys(opportunity.evidence).length > 0 && (
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} style={{ color: HV_THEME.dark.text.muted }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                    Evidence
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.entries(opportunity.evidence).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-xs shrink-0" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                        {key}:
                      </span>
                      <span className="text-xs" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Action */}
            {opportunity.recommendedAction && (
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={14} style={{ color: HV_THEME.dark.text.muted }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                    Recommended Action
                  </span>
                </div>
                <p className="text-sm" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
                  {opportunity.recommendedAction}
                </p>
              </div>
            )}

            {/* Related Transaction */}
            {opportunity.resultingTransactionId && (
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Link2 size={14} style={{ color: HV_THEME.dark.text.muted }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                    Related Transaction
                  </span>
                </div>
                <a
                  href={`/hotel/order/${opportunity.resultingTransactionId}`}
                  className="flex items-center gap-2 text-xs hover:underline"
                  style={{ color: HV_THEME.dark.accent.base, fontWeight: 400 }}
                >
                  <ExternalLink size={12} />
                  View Transaction: {opportunity.resultingTransactionId.slice(0, 8)}...
                </a>
              </div>
            )}
          </div>

          {/* Right column — Context & Actions */}
          <div className="space-y-6">
            {/* Confidence Score */}
            {opportunity.confidence != null && (
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
              >
                <span className="text-xs uppercase tracking-wider block mb-3" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  Confidence Score
                </span>
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: HV_THEME.dark.border.visible }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: HV_THEME.dark.accent.base,
                        width: `${opportunity.confidence * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className="text-sm tabular-nums"
                    style={{ color: HV_THEME.dark.accent.base, fontWeight: 400 }}
                  >
                    {(opportunity.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            {/* Supplier Info */}
            {opportunity.affectedSupplier && (
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
              >
                <span className="text-xs uppercase tracking-wider block mb-2" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  Affected Supplier
                </span>
                <p className="text-sm" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
                  {opportunity.affectedSupplier.name}
                </p>
              </div>
            )}

            {/* Product Info */}
            {opportunity.affectedProduct && (
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
              >
                <span className="text-xs uppercase tracking-wider block mb-2" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  Affected Product
                </span>
                <p className="text-sm" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
                  {opportunity.affectedProduct.name}
                </p>
                {opportunity.affectedProduct.sku && (
                  <p className="text-xs mt-1" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                    SKU: {opportunity.affectedProduct.sku}
                  </p>
                )}
              </div>
            )}

            {/* Category */}
            {opportunity.affectedCategory && (
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
              >
                <span className="text-xs uppercase tracking-wider block mb-2" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  Category
                </span>
                <p className="text-sm" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
                  {opportunity.affectedCategory}
                </p>
              </div>
            )}

            {/* Owner */}
            {opportunity.owner && (
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
              >
                <span className="text-xs uppercase tracking-wider block mb-2" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  Assigned To
                </span>
                <p className="text-sm" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
                  {opportunity.owner.name}
                </p>
                <p className="text-xs mt-1" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                  {opportunity.owner.email}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: HV_THEME.dark.surface, borderColor: HV_THEME.dark.border.visible }}
            >
              <div className="space-y-2">
                <div>
                  <span className="text-xs block" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                    Detected
                  </span>
                  <span className="text-xs" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
                    {new Date(opportunity.createdAt).toLocaleDateString("en-EG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-xs block" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
                    Last Updated
                  </span>
                  <span className="text-xs" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
                    {new Date(opportunity.updatedAt).toLocaleDateString("en-EG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="mt-8 flex items-center gap-3 pt-6 border-t"
          style={{ borderColor: HV_THEME.dark.border.visible }}
        >
          <Button
            variant="outline"
            onClick={() => handleAction("review")}
            disabled={!!actionLoading || opportunity.status === "REVIEWING"}
            className="flex items-center gap-2"
            style={{ fontWeight: 400 }}
          >
            {actionLoading === "review" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Eye size={14} />
            )}
            Mark as Reviewing
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction("rfq")}
            disabled={!!actionLoading || opportunity.status === "RFQ_SENT"}
            className="flex items-center gap-2"
            style={{ fontWeight: 400 }}
          >
            {actionLoading === "rfq" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Request RFQ
          </Button>
          <Button
            onClick={() => handleAction("approve")}
            disabled={!!actionLoading || opportunity.status === "APPROVED"}
            className="flex items-center gap-2"
            style={{ fontWeight: 400 }}
          >
            {actionLoading === "approve" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Approve
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleAction("dismiss")}
            disabled={!!actionLoading || opportunity.status === "CLOSED"}
            className="flex items-center gap-2"
            style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
          >
            {actionLoading === "dismiss" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            Dismiss
          </Button>
        </div>
      </main>
    </div>
  );
}
