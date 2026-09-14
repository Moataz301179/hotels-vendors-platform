import { LucideIcon } from "lucide-react";

interface MetricTileProps {
  label: string;
  value: string;
  trend?: string;
  icon: LucideIcon;
  iconBg?: string;
}

export function MetricTile({
  label,
  value,
  trend,
  icon: Icon,
  iconBg = "bg-cyan-500/10 text-cyan-400",
}: MetricTileProps) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-[var(--foreground-muted)] mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
