import Image from "next/image";
import { HV_THEME, HV_CATEGORY_COLORS, HvCategoryKey } from "@/components/theme/tokens";
import { HOTEL_CATEGORIES } from "@/lib/marketplace/categories";

export interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  subcategory?: string;
  unitPrice: number;
  currency: string;
  stockQuantity: number;
  minOrderQty: number;
  unitOfMeasure: string;
  leadTimeDays: number;
  shelfLifeDays?: number;
  temperatureReq?: string;
  supplierName: string;
  supplierTier?: string;
  supplierRating?: number;
  supplierReviewCount?: number;
  supplierCity?: string;
  onAddToCart?: (id: string, qty: number) => void;
  onViewDetails?: (id: string) => void;
  compareData?: Record<string, unknown>;
  variant?: "marketplace" | "dashboard";
}

export function ProductCard({
  id, name, description, sku, category, subcategory,
  unitPrice, currency, stockQuantity, minOrderQty, unitOfMeasure,
  leadTimeDays, shelfLifeDays, temperatureReq,
  supplierName, supplierTier, supplierRating, supplierReviewCount, supplierCity,
  onAddToCart, onViewDetails, compareData,
  variant = "marketplace",
}: ProductCardProps) {
  const isMarketplace = variant === "marketplace";
  const cat = HOTEL_CATEGORIES.find((c) => c.id === category);
  const catColor = HV_CATEGORY_COLORS[category as HvCategoryKey] || {
    bg: HV_THEME.dark.accent.muted,
    text: HV_THEME.dark.accent.base,
    border: HV_THEME.dark.accent.muted,
  };
  const theme = isMarketplace ? HV_THEME.light : HV_THEME.dark;

  return (
    <div
      className="group relative flex flex-col"
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border.visible}`,
        borderRadius: HV_THEME.layout.borderRadius.md,
        fontFamily: HV_THEME.font.family,
      }}
    >
      <div className="p-4">
        <h3 className="mb-1 text-sm" style={{ color: theme.text.primary, fontWeight: 400 }}>
          {name}
        </h3>
        <p className="mb-3 text-xs" style={{ color: theme.text.secondary, fontWeight: 400 }}>
          {supplierName}
        </p>
        <div className="mb-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: theme.text.muted, fontWeight: 400 }}>Unit Price</span>
            <span className="text-xs" style={{ color: theme.text.primary, fontWeight: 400 }}>
              {unitPrice.toLocaleString("en-US", { style: "currency", currency: currency || "EGP", maximumFractionDigits: 2 })}
              {" "}/ {unitOfMeasure}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: theme.text.muted, fontWeight: 400 }}>Moq</span>
            <span className="text-xs" style={{ color: theme.text.primary, fontWeight: 400 }}>{minOrderQty}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: theme.text.muted, fontWeight: 400 }}>Lead Time</span>
            <span className="text-xs" style={{ color: theme.text.primary, fontWeight: 400 }}>{leadTimeDays} days</span>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className={`text-xs ${stockQuantity > 0 ? "text-green-400" : "text-red-400"}`} style={{ fontWeight: 400 }}>
            {stockQuantity > 0 ? "In Stock" : "Out of Stock"}
          </span>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(id, minOrderQty)}
              className="text-xs px-3 py-1 rounded"
              style={{ backgroundColor: HV_THEME.dark.accent.base, color: "#fff", fontWeight: 400 }}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
