export type EtaComplianceStatus = "MISSING" | "OVERDUE" | "DUE_SOON" | "ON_TRACK" | "CLOSED";

type EtaMonitoredOrder = {
  status: string;
  estimatedDelivery: Date | null;
};

const CLOSED_ORDER_STATUSES = new Set(["DELIVERED", "CANCELLED", "REJECTED"]);
const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

export function classifyEtaCompliance(order: EtaMonitoredOrder, now = new Date()): EtaComplianceStatus {
  if (CLOSED_ORDER_STATUSES.has(order.status)) return "CLOSED";
  if (!order.estimatedDelivery) return "MISSING";

  const remainingMs = order.estimatedDelivery.getTime() - now.getTime();
  if (remainingMs < 0) return "OVERDUE";
  if (remainingMs <= DUE_SOON_WINDOW_MS) return "DUE_SOON";
  return "ON_TRACK";
}

export const etaComplianceLabel: Record<EtaComplianceStatus, string> = {
  MISSING: "ETA required",
  OVERDUE: "Past committed ETA",
  DUE_SOON: "Due within 24 hours",
  ON_TRACK: "On track",
  CLOSED: "Closed",
};
