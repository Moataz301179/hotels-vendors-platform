interface StatusPillProps {
  status: string;
}

const STATUS_MAP: Record<string, { text: string; dot: string; bg: string }> = {
  approved: { text: "Approved", dot: "bg-emerald-400", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  pending: { text: "Pending", dot: "bg-amber-400", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  rejected: { text: "Rejected", dot: "bg-red-500", bg: "bg-red-500/10 text-red-400 border-red-500/20" },
  "in transit": { text: "In Transit", dot: "bg-cyan-400", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  confirmed: { text: "Confirmed", dot: "bg-cyan-400", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  shipped: { text: "Shipped", dot: "bg-yellow-400", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  delivered: { text: "Delivered", dot: "bg-emerald-400", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  processing: { text: "Processing", dot: "bg-purple-400", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  draft: { text: "Draft", dot: "bg-gray-500", bg: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  low: { text: "Low Stock", dot: "bg-amber-400", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  critical: { text: "Critical", dot: "bg-red-500", bg: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function StatusPill({ status }: StatusPillProps) {
  const key = status.toLowerCase().replace(/_/g, " ");
  const config = STATUS_MAP[key] || STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.text}
    </span>
  );
}
