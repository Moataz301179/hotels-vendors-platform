import { HV_THEME, HV_CATEGORY_COLORS } from "@/components/theme/tokens";
import { HOTEL_CATEGORIES } from "@/lib/marketplace/categories";

/**
 * HotelsVendors Hotel Procurement Dashboard
 * Mirrors ICE.com's data-dense institutional dashboard:
 * - Dark charcoal (#0A0A0A) background
 * - White cards (#FAFAFA) with data tables / charts
 * - #FF3D00 accent for borders and interactive states
 * - No bold fonts (font-weight: 400)
 * - Multi-panel grid (spend overview | top suppliers | recent orders | reorder alerts)
 */
export interface SpendByCategory {
  categoryId: string;
  label: string;
  amount: number;
  percentage: number;
}

export const SAMPLE_SPEND_DATA: SpendByCategory[] = [
  { categoryId: "fb", label: "F&B", amount: 285000, percentage: 34.2 },
  { categoryId: "hk", label: "Housekeeping", amount: 156000, percentage: 18.7 },
  { categoryId: "eng", label: "Engineering", amount: 124000, percentage: 14.9 },
  { categoryId: "lin", label: "Linens", amount: 89000, percentage: 10.7 },
  { categoryId: "gra", label: "Amenities", amount: 67000, percentage: 8.0 },
  { categoryId: "it", label: "IT", amount: 45000, percentage: 5.4 },
  { categoryId: "sec", label: "Safety", amount: 32000, percentage: 3.8 },
  { categoryId: "ffe", label: "Furniture", amount: 28000, percentage: 3.4 },
];

export interface OrderRow {
  id: string;
  supplier: string;
  category: string;
  amount: number;
  status: "Draft" | "Pending Approval" | "Approved" | "Confirmed" | "In Transit" | "Delivered";
  date: string;
}

export const SAMPLE_ORDERS: OrderRow[] = [
  { id: "PO-2026-0184", supplier: "Delta Meats Co.", category: "F&B", amount: 52450, status: "In Transit", date: "2026-09-10" },
  { id: "PO-2026-0183", supplier: "CleanTech Industries", category: "Housekeeping", amount: 18750, status: "Delivered", date: "2026-09-08" },
  { id: "PO-2026-0182", supplier: "Misr Textiles", category: "Linens", amount: 34200, status: "In Transit", date: "2026-09-09" },
  { id: "PO-2026-0181", supplier: "SleepWell Manufacturing", category: "Furniture", amount: 128000, status: "Pending Approval", date: "2026-09-11" },
  { id: "PO-2026-0180", supplier: "Golden Line Cosmetics", category: "Amenities", amount: 3200, status: "Approved", date: "2026-09-07" },
];

export default function HotelDashboard() {
  const totalSpend = SAMPLE_SPEND_DATA.reduce((sum, item) => sum + item.amount, 0);
  const totalPlatformFees = totalSpend * 0.025; // 2.5% mid-tier fee
  const etaSavings = totalSpend * 0.015; // 1.5% ETA tax savings estimate

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: HV_THEME.dark.background,
        color: HV_THEME.dark.text.primary,
        fontFamily: HV_THEME.font.family,
      }}
    >
      {/* Dashboard header — mirrors ICE's data dashboard header */}
      <header
        className="border-b px-[--hv-px] py-4"
        style={{
          backgroundColor: HV_THEME.dark.surface,
          borderBottomColor: HV_THEME.dark.border.visible,
        }}
      >
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: HV_THEME.layout.containerMax }}>
          <h1 className="text-2xl" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
            Procurement Dashboard
          </h1>
          <span className="text-sm" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
            Last 30 days • EGP
          </span>
        </div>
      </header>

      <main className="mx-auto px-[--hv-px] py-8" style={{ maxWidth: HV_THEME.layout.containerMax }}>
        {/* Trust metrics row — mirrors ICE's summary data fields */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Total Spend" value={`EGP ${totalSpend.toLocaleString()}`} accentColor={HV_THEME.dark.accent.base} />
          <MetricCard label="Platform Fees" value={`EGP ${totalPlatformFees.toLocaleString()}`} accentColor={HV_THEME.dark.accent.base} />
          <MetricCard label="ETA Savings" value={`EGP ${etaSavings.toLocaleString()}`} accentColor={HV_THEME.dark.accent.base} />
          <MetricCard label="Active Orders" value={SAMPLE_ORDERS.length.toString()} accentColor={HV_THEME.dark.accent.base} />
        </div>

        {/* Main content grid — mirrors ICE's multi-panel dashboard */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Spend by category — mirrors ICE's commodity breakdown */}
          <div className="lg:col-span-2" style={{ backgroundColor: HV_THEME.dark.surface, border: `1px solid ${HV_THEME.dark.border.visible}`, borderRadius: HV_THEME.layout.borderRadius.md }}>
            <SpendByCategoryTable data={SAMPLE_SPEND_DATA} />
          </div>

          {/* Recent orders table — mirrors ICE's order/status table */}
          <div style={{ backgroundColor: HV_THEME.dark.surface, border: `1px solid ${HV_THEME.dark.border.visible}`, borderRadius: HV_THEME.layout.borderRadius.md }}>
            <RecentOrdersTable orders={SAMPLE_ORDERS} />
          </div>
        </div>
      </main>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  accentColor: string;
}

function MetricCard({ label, value, accentColor }: MetricCardProps) {
  return (
    <div
      className="rounded-md border p-4"
      style={{
        backgroundColor: HV_THEME.dark.surface,
        border: `1px solid ${HV_THEME.dark.border.visible}`,
      }}
    >
      <span className="block text-xs" style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}>
        {label}
      </span>
      <span className="mt-1 block text-2xl" style={{ color: accentColor, fontWeight: 400 }}>
        {value}
      </span>
    </div>
  );
}

function SpendByCategoryTable({ data }: { data: SpendByCategory[] }) {
  return (
    <div className="p-4">
      <h2 className="mb-4 text-sm" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
        Spend by Category
      </h2>
      <div className="space-y-2">
        {data.map((item) => {
          const catColor = HV_CATEGORY_COLORS[item.categoryId as keyof typeof HV_CATEGORY_COLORS];
          return (
            <div key={item.categoryId} className="flex items-center gap-3">
              <div
                className="h-2 w-3 rounded"
                style={{ backgroundColor: catColor?.border || HV_THEME.dark.accent.base }}
              />
              <span className="w-24 text-xs" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
                {item.label}
              </span>
              <span className="flex-1 text-xs" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
                EGP {item.amount.toLocaleString()}
              </span>
              <span className="w-12 text-right text-xs" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentOrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="p-4">
      <h2 className="mb-4 text-sm" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
        Recent Orders
      </h2>
      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between border-b py-2" style={{ borderBottomColor: HV_THEME.dark.border.subtle }}>
            <div>
              <span className="text-xs" style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}>
                {order.id}
              </span>
              <span className="ml-2 text-xs" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
                {order.supplier}
              </span>
            </div>
            <span className="text-xs" style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}>
              EGP {order.amount.toLocaleString()}
            </span>
            <StatusBadge status={order.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderRow["status"] }) {
  const statusColors: Record<string, string> = {
    "In Transit": "#3B82F6",
    "Delivered": "#4ADE80",
    "Pending Approval": "#F59E0B",
    "Approved": "#8B5CF6",
    "Confirmed": "#06B6D4",
    "Draft": HV_THEME.dark.text.muted,
  };
  const color = statusColors[status] || HV_THEME.dark.text.muted;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs"
      style={{
        backgroundColor: `rgba(${hexToRgb(color)}, 0.12)`,
        color: color,
        fontWeight: 400,
        border: `1px solid ${color}33`,
      }}
    >
      {status}
    </span>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0,0,0";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}
