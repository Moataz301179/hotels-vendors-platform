const BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  // Procurement states
  draft: { bg: "rgba(var(--foreground-tertiary-rgb),0.15)", text: "var(--foreground-tertiary)", label: "Draft" },
  pending_approval: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Pending Approval" },
  approved: { bg: "rgba(var(--accent-base-rgb),0.12)", text: "var(--accent-base)", label: "Approved" },
  ordered: { bg: "var(--info-bg)", text: "var(--info)", label: "Ordered" },
  shipped: { bg: "var(--info-bg)", text: "var(--info)", label: "Shipped" },
  delivered: { bg: "rgba(var(--accent-base-rgb),0.15)", text: "var(--accent-base)", label: "Delivered" },
  invoiced: { bg: "var(--purple-base)/10", text: "var(--purple-base)", label: "Invoiced" },
  paid: { bg: "rgba(var(--accent-base-rgb),0.15)", text: "var(--accent-base)", label: "Paid" },
  disputed: { bg: "var(--error-bg)", text: "var(--error)", label: "Disputed" },
  cancelled: { bg: "rgba(var(--foreground-tertiary-rgb),0.15)", text: "var(--foreground-tertiary)", label: "Cancelled" },
  // Invoice qualification
  pending_documents: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Pending Documents" },
  qualified: { bg: "rgba(var(--accent-base-rgb),0.15)", text: "var(--accent-base)", label: "Qualified" },
  rejected: { bg: "var(--error-bg)", text: "var(--error)", label: "Rejected" },
  expired: { bg: "rgba(var(--foreground-tertiary-rgb),0.15)", text: "var(--foreground-tertiary)", label: "Expired" },
  // Fraud gate
  // (pending already mapped above)
  cleared: { bg: "rgba(var(--accent-base-rgb),0.15)", text: "var(--accent-base)", label: "Cleared" },
  flagged: { bg: "rgba(var(--orange-base-rgb),0.15)", text: "var(--orange-base)", label: "Flagged" },
  blocked: { bg: "var(--error-bg)", text: "var(--error)", label: "Blocked" },
  // ETA
  submitted: { bg: "rgba(var(--accent-base-rgb),0.15)", text: "var(--accent-base)", label: "Submitted" },
  failed: { bg: "var(--error-bg)", text: "var(--error)", label: "Failed" },
  // Factoring match
  not_submitted: { bg: "rgba(var(--foreground-tertiary-rgb),0.15)", text: "var(--foreground-tertiary)", label: "Not Submitted" },
  matched: { bg: "var(--info-bg)", text: "var(--info)", label: "Matched" },
  funded: { bg: "rgba(var(--accent-base-rgb),0.15)", text: "var(--accent-base)", label: "Funded" },
  // Subscription
  trial: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Trial" },
  active: { bg: "rgba(var(--accent-base-rgb),0.12)", text: "var(--accent-base)", label: "Active" },
  past_due: { bg: "rgba(var(--orange-base-rgb),0.15)", text: "var(--orange-base)", label: "Past Due" },
  // Alerts
  open: { bg: "var(--error-bg)", text: "var(--error)", label: "Open" },
  acknowledged: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Acknowledged" },
  resolved: { bg: "rgba(var(--accent-base-rgb),0.15)", text: "var(--accent-base)", label: "Resolved" },
  // Risk bands
  low: { bg: "rgba(var(--accent-base-rgb),0.12)", text: "var(--accent-base)", label: "Low Risk" },
  medium: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Medium Risk" },
  high: { bg: "rgba(var(--orange-base-rgb),0.15)", text: "var(--orange-base)", label: "High Risk" },
  critical: { bg: "var(--error-bg)", text: "var(--error)", label: "Critical Risk" },
  // Compliance
  pass: { bg: "rgba(var(--accent-base-rgb),0.15)", text: "var(--accent-base)", label: "Pass" },
  fail: { bg: "var(--error-bg)", text: "var(--error)", label: "Fail" },
  not_applicable: { bg: "rgba(var(--foreground-tertiary-rgb),0.15)", text: "var(--foreground-tertiary)", label: "N/A" },
  // Bidding
  bidding_open: { bg: "var(--info-bg)", text: "var(--info)", label: "Bidding Open" },
};

const DEFAULT_BADGE = { bg: "rgba(var(--foreground-tertiary-rgb),0.15)", text: "var(--foreground-tertiary)", label: "Unknown" };

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const style = BADGE_STYLES[status] || { ...DEFAULT_BADGE, label: status };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${className}`}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

export function RiskBadge({ score }: { score: number | null }) {
  if (score === null) return <StatusBadge status="not_applicable" />;
  if (score >= 75) return <StatusBadge status="low" />;
  if (score >= 50) return <StatusBadge status="medium" />;
  if (score >= 25) return <StatusBadge status="high" />;
  return <StatusBadge status="critical" />;
}
