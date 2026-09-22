"use client";

import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ExternalLink,
  Check,
  X as XIcon,
} from "lucide-react";
import { SlideOver } from "./slide-over";

interface OrderItem {
  quantity: number;
  total: number;
  product: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  deliveryDate: string | null;
  hotel: { name: string };
  supplier: { name: string };
  items: OrderItem[];
}

interface OrderDetailPanelProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (order: Order) => void;
  onReject?: (order: Order) => void;
  onViewFull?: (order: Order) => void;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING_APPROVAL: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Pending Approval" },
  APPROVED: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Approved" },
  CONFIRMED: { bg: "bg-accent-base/10", text: "text-accent-base", dot: "bg-accent-base", label: "Confirmed" },
  IN_TRANSIT: { bg: "bg-accent-base/10", text: "text-accent-base", dot: "bg-accent-base", label: "In Transit" },
  DELIVERED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Delivered" },
  CANCELLED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Cancelled" },
  DRAFT: { bg: "bg-white/10", text: "text-foreground-muted", dot: "bg-white/40", label: "Draft" },
};

const timelineSteps = [
  { key: "DRAFT", label: "Created", icon: Package },
  { key: "PENDING_APPROVAL", label: "Pending Approval", icon: Clock },
  { key: "APPROVED", label: "Approved", icon: CheckCircle2 },
  { key: "CONFIRMED", label: "Confirmed", icon: Check },
  { key: "IN_TRANSIT", label: "In Transit", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

function formatCurrency(amount: number, currency = "EGP") {
  return `${currency} ${amount.toLocaleString("en-EG")}`;
}

function StatusBadge({ status }: { status: string }) {
  const c = statusConfig[status] || statusConfig.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function Timeline({ status }: { status: string }) {
  const activeIdx = timelineSteps.findIndex((s) => s.key === status);

  return (
    <div className="space-y-0">
      {timelineSteps.map((step, i) => {
        const isComplete = i <= activeIdx;
        const isCurrent = i === activeIdx;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-start gap-3 relative">
            {/* Vertical line */}
            {i < timelineSteps.length - 1 && (
              <div className={`absolute left-[11px] top-[24px] w-px h-[20px] ${isComplete ? "bg-accent-base/40" : "bg-surface-2"}`} />
            )}
            {/* Dot / Icon */}
            <div className={`relative z-10 flex items-center justify-center w-[22px] h-[22px] rounded-full shrink-0 mt-0.5 ${
              isCurrent
                ? "bg-accent-base/20 ring-2 ring-accent-base/40"
                : isComplete
                  ? "bg-accent-base/10"
                  : "bg-white/[0.04]"
            }`}>
              <Icon size={11} className={isComplete ? "text-accent-base" : "text-foreground-muted"} />
            </div>
            {/* Label */}
            <span className={`text-xs pb-5 ${isCurrent ? "text-white font-medium" : isComplete ? "text-foreground-tertiary" : "text-foreground-muted"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function OrderDetailPanel({
  order,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onViewFull,
}: OrderDetailPanelProps) {
  if (!order) return null;

  const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={`Order ${order.orderNumber}`}
      description={`${order.hotel?.name} → ${order.supplier?.name}`}
    >
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
            <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Status</p>
            <div className="mt-1.5"><StatusBadge status={order.status} /></div>
          </div>
          <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
            <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Total</p>
            <p className="text-sm font-semibold text-white mt-1">{formatCurrency(order.total, order.currency)}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
            <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Items</p>
            <p className="text-sm text-white mt-1">{itemCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
            <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Delivery</p>
            <p className="text-sm text-white mt-1">
              {order.deliveryDate
                ? new Date(order.deliveryDate).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>

        {/* Items table */}
        <div>
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-2">Order Items</p>
          <div className="rounded-lg border border-border-invisible overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-invisible bg-white/[0.01]">
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-foreground-muted uppercase">Product</th>
                  <th className="text-right px-3 py-2 text-[10px] font-medium text-foreground-muted uppercase">Qty</th>
                  <th className="text-right px-3 py-2 text-[10px] font-medium text-foreground-muted uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, i) => (
                  <tr key={i} className="border-b border-white/[0.03] last:border-b-0">
                    <td className="px-3 py-2 text-xs text-foreground-secondary">{item.product?.name}</td>
                    <td className="px-3 py-2 text-xs text-foreground-muted text-right">×{item.quantity}</td>
                    <td className="px-3 py-2 text-xs text-white text-right font-medium">{formatCurrency(item.total, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-3">Timeline</p>
          <Timeline status={order.status} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border-invisible">
          {order.status === "PENDING_APPROVAL" && onApprove && (
            <button
              onClick={() => onApprove(order)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-base text-surface text-xs font-semibold hover:bg-accent-light transition-colors"
            >
              <Check size={14} />
              Approve
            </button>
          )}
          {order.status === "PENDING_APPROVAL" && onReject && (
            <button
              onClick={() => onReject(order)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
            >
              <XIcon size={14} />
              Reject
            </button>
          )}
          {onViewFull && (
            <button
              onClick={() => onViewFull(order)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-border-subtle text-foreground-secondary text-xs font-medium hover:text-white hover:bg-surface-2 transition-colors"
            >
              <ExternalLink size={13} />
              View Full Order
            </button>
          )}
        </div>
      </div>
    </SlideOver>
  );
}
