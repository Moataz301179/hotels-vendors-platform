const BG_CARD = "var(--bg-surface-1)";
const BORDER = "rgba(255,255,255,0.06)";
const TEXT_PRIMARY = "#E9ECEF";
const TEXT_SECONDARY = "#9AA0A6";
const TEXT_MUTED = "#6C757D";
const ACCENT_ORANGE = "var(--accent-base)";

export function KPICard({
  title,
  value,
  subtitle,
  accent = false,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: BG_CARD,
        border: `1px solid ${accent ? "rgba(var(--accent-base-rgb),0.20)" : BORDER}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
          {title}
        </span>
        {icon && <span style={{ color: ACCENT_ORANGE }}>{icon}</span>}
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color: accent ? ACCENT_ORANGE : TEXT_PRIMARY }}>
        {typeof value === "number" ? value.toLocaleString("en-EG") : value}
      </div>
      {subtitle && (
        <p className="text-[12px] mt-1" style={{ color: TEXT_SECONDARY }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function KPIGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
