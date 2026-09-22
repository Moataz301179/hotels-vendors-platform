"use client";

import { useEffect, useState, useRef } from "react";

interface TickerItem {
  nameAr: string;
  nameEn: string;
  price: number;
  unit: string;
  change: number;
}

const SEED_ITEMS: TickerItem[] = [
  { nameAr: "مواد غذائية طازجة", nameEn: "Fresh Food Supplies", price: 185, unit: "كجم", change: 1.2 },
  { nameAr: "مستلزمات نظافة", nameEn: "Cleaning Supplies", price: 42, unit: "لتر", change: -0.8 },
  { nameAr: "مفروشات فندقية", nameEn: "Hotel Linens", price: 320, unit: "قطعة", change: 2.4 },
  { nameAr: "مشروبات غازية", nameEn: "Soft Drinks", price: 12, unit: "كرتون", change: -1.5 },
  { nameAr: "مواد تعقيم", nameEn: "Sanitizers", price: 65, unit: "لتر", change: 0.6 },
  { nameAr: "فواكه طازجة", nameEn: "Fresh Fruits", price: 28, unit: "كجم", change: 3.1 },
  { nameAr: "لحوم مجمدة", nameEn: "Frozen Meat", price: 210, unit: "كجم", change: -2.1 },
  { nameAr: "منتجات ألبان", nameEn: "Dairy Products", price: 35, unit: "كجم", change: 0.3 },
  { nameAr: "مواد خام للطبخ", nameEn: "Cooking Ingredients", price: 55, unit: "كجم", change: 1.8 },
  { nameAr: "مستلزمات حمام", nameEn: "Bathroom Amenities", price: 85, unit: "مجموعة", change: -0.4 },
  { nameAr: "كيماويات مسابح", nameEn: "Pool Chemicals", price: 120, unit: "كجم", change: 2.7 },
  { nameAr: "غسيل ومبيضات", nameEn: "Laundry & Bleach", price: 38, unit: "كجم", change: -1.2 },
  { nameAr: "إضاءة LED", nameEn: "LED Lighting", price: 150, unit: "وحدة", change: 0.9 },
  { nameAr: "أدوات مطبخ", nameEn: "Kitchen Tools", price: 275, unit: "قطعة", change: -0.6 },
  { nameAr: "ورق تواليت", nameEn: "Toilet Paper", price: 5, unit: "رول", change: 1.4 },
  { nameAr: "مناديل ورقية", nameEn: "Paper Towels", price: 18, unit: "حزمة", change: -0.3 },
  { nameAr: "بطاريات صناعية", nameEn: "Industrial Batteries", price: 420, unit: "وحدة", change: 2.2 },
  { nameAr: "فلاتر مياه", nameEn: "Water Filters", price: 95, unit: "فلتر", change: 0.1 },
];

function randomChange() {
  return +(Math.random() * 6 - 2.5).toFixed(2);
}

export function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>(SEED_ITEMS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          change: randomChange(),
          price: Math.max(1, +(item.price * (1 + (Math.random() * 0.02 - 0.01))).toFixed(0)),
        }))
      );
    }, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const doubled = [...items, ...items];

  // Theme-aware colors
  const isHercules = false;
  const isOriginal = false;
  const accentColor = "#FF6B00";
  const bgColor = isHercules ? "#0a1628" : "#050505";
  const borderColor = isHercules ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)";
  const textColor = isHercules ? "#f0f4f8" : "#ffffff";
  const textMuted = isHercules ? "#94a3b8" : "rgba(255,255,255,0.70)";
  const textFaint = isHercules ? "#64748b" : "rgba(255,255,255,0.30)";
  const textPrice = isHercules ? "#94a3b8" : "rgba(255,255,255,0.40)";
  const sepColor = isHercules ? "rgba(61, 46, 30, 0.6)" : "rgba(255,255,255,0.10)";

  return (
    <div
      className="w-full overflow-hidden border-y py-2.5"
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <div className="flex items-center">
        {/* Fixed label */}
        <div
          className="shrink-0 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider flex items-center gap-2 border-r"
          style={{ color: accentColor, borderColor }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
          <span>مؤشر السوق · Market Index</span>
        </div>

        {/* Scrolling marquee — 15s desktop, 25s mobile */}
        <div className="overflow-hidden flex-1">
          <div className="flex animate-marquee whitespace-nowrap">
            {doubled.map((item, i) => {
              const isUp = item.change >= 0;
              return (
                <div
                  key={`${item.nameEn}-${i}`}
                  className="inline-flex items-center gap-2 px-5 text-[11px]"
                >
                  <span style={{ color: textMuted }}>{item.nameAr}</span>
                  <span style={{ color: textFaint }}>·</span>
                  <span className="font-mono" style={{ color: textPrice }}>
                    {item.price} ج.م/{item.unit}
                  </span>
                  <span
                    className="font-mono text-[10px] flex items-center gap-0.5"
                    style={{ color: isUp ? "var(--success)" : "var(--error)" }}
                  >
                    {isUp ? "▲" : "▼"}
                    {Math.abs(item.change).toFixed(1)}%
                  </span>
                  <span style={{ color: sepColor }}>|</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
