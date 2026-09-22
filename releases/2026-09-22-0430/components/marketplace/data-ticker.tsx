import { HV_THEME } from "@/components/theme/tokens";

/**
 * HotelsVendors Live Data Ticker
 * Mirrors ICE.com's commodity data ticker:
 * - Dark background (#0A0A0A)
 * - Horizontal scrolling live data
 * - Category label, ticker symbol, value, change %
 * - 2px borders, no bold fonts
 */
export interface TickerItem {
  id: string;
  category: string;
  symbol: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface DataTickerProps {
  items: TickerItem[];
  autoScroll?: boolean;
}

export function DataTicker({ items, autoScroll = true }: DataTickerProps) {
  // Duplicate for seamless scroll
  const displayItems = [...items, ...items];

  return (
    <div
      className="overflow-hidden border-y"
      style={{
        backgroundColor: HV_THEME.dark.surface,
        borderColor: HV_THEME.dark.border.subtle,
        fontFamily: HV_THEME.font.family,
      }}
    >
      <div className="px-[--hv-px] py-2">
        <div
          className={`flex items-center gap-1 ${autoScroll ? "animate-ticker-scroll" : "overflow-x-auto"}`}
        >
          {displayItems.map((item, i) => (
            <TickerItemRow key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TickerItemRow({ item }: { item: TickerItem }) {
  const isPositive = item.isPositive;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 whitespace-nowrap">
      {/* Category label — mirrors ICE's "Energy" tag */}
      <span
        className="text-xs uppercase"
        style={{
          color: HV_THEME.dark.text.muted,
          fontWeight: 400,
        }}
      >
        {item.category}
      </span>
      {/* Symbol — mirrors ICE's "B" ticker symbol */}
      <span
        className="text-xs"
        style={{
          color: HV_THEME.dark.accent.base,
          fontWeight: 400,
        }}
      >
        [{item.symbol}]
      </span>
      {/* Value — mirrors ICE's price */}
      <span
        className="text-xs"
        style={{
          color: HV_THEME.dark.text.primary,
          fontWeight: 400,
        }}
      >
        {item.value}
      </span>
      {/* Change — mirrors ICE's delta */}
      <span
        className="text-xs"
        style={{
          color: isPositive ? "#4ADE80" : "#F87171",
          fontWeight: 400,
        }}
      >
        {item.change}
      </span>
    </div>
  );
}

/**
 * Sample ticker data — real Egyptian hospitality suppliers
 * Mirrors ICE's live commodity data, but for procurement categories
 */
export const SAMPLE_TICKER_ITEMS: TickerItem[] = [
  { id: "vegetables", category: "F&B", symbol: "VEG", value: "EGP 32.50/kg", change: "+1.2%", isPositive: true },
  { id: "cleaning", category: "HK", symbol: "CLN", value: "EGP 185.00", change: "-0.4%", isPositive: false },
  { id: "beef", category: "F&B", symbol: "BEF", value: "EGP 185.40/kg", change: "+2.8%", isPositive: true },
  { id: "linen", category: "LIN", symbol: "LIN", value: "EGP 240.00/set", change: "+0.8%", isPositive: true },
  { id: "fuel", category: "ENG", symbol: "FUE", value: "EGP 26.90/liter", change: "-1.1%", isPositive: false },
  { id: "chicken", category: "F&B", symbol: "CHI", value: "EGP 92.50/kg", change: "+3.5%", isPositive: true },
  { id: "amenities", category: "GRA", symbol: "AMN", value: "EGP 12.50/set", change: "+0.3%", isPositive: true },
  { id: "hvac", category: "ENG", symbol: "HVAC", value: "EGP 4,250.00", change: "-0.9%", isPositive: false },
];
