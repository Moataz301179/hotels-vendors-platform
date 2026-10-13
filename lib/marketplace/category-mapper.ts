/**
 * Category Mapper
 * Bridges the gap between Prisma ProductCategory enum values
 * and the marketplace short category codes.
 *
 * Prisma enum: F_AND_B | CONSUMABLES | GUEST_SUPPLIES | FFE | SERVICES
 * Marketplace: fb | hk | ffe | ose | gra | lin | eng | spa | it | sec
 */

import { ProductCategory } from "@prisma/client";
import { HOTEL_CATEGORIES, type HotelCategory } from "./categories";

// ── Prisma → Marketplace mapping ──────────────────────────────

export const PRISMA_TO_MARKETPLACE: Record<ProductCategory, string> = {
  F_AND_B: "fb",
  CONSUMABLES: "ose",
  GUEST_SUPPLIES: "gra",
  FFE: "ffe",
  SERVICES: "eng",
};

export const MARKETPLACE_TO_PRISMA: Record<string, ProductCategory> = {
  fb: "F_AND_B",
  hk: "CONSUMABLES", // Housekeeping items often classified as consumables
  ffe: "FFE",
  ose: "CONSUMABLES", // OS&E = consumables
  gra: "GUEST_SUPPLIES",
  lin: "GUEST_SUPPLIES", // Linens are guest supplies
  eng: "SERVICES",
  spa: "GUEST_SUPPLIES",
  it: "SERVICES",
  sec: "SERVICES",
};

// ── Conversion functions ──────────────────────────────────────

/** Convert Prisma ProductCategory enum to marketplace short code */
export function toMarketplaceCategory(prismaCategory: ProductCategory): string {
  return PRISMA_TO_MARKETPLACE[prismaCategory] || "fb";
}

/** Convert marketplace short code to Prisma ProductCategory enum */
export function toPrismaCategory(marketplaceCode: string): ProductCategory {
  return MARKETPLACE_TO_PRISMA[marketplaceCode] || "F_AND_B";
}

/** Get full HotelCategory metadata from a Prisma category */
export function getHotelCategoryFromPrisma(prismaCategory: ProductCategory): HotelCategory | undefined {
  const code = toMarketplaceCategory(prismaCategory);
  return HOTEL_CATEGORIES.find((c) => c.id === code);
}

/** Get full HotelCategory metadata from a marketplace code */
export function getHotelCategoryFromMarketplace(code: string): HotelCategory | undefined {
  return HOTEL_CATEGORIES.find((c) => c.id === code);
}

// ── Product transformer ───────────────────────────────────────

export interface MarketplaceProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string; // marketplace short code: fb, hk, etc.
  prismaCategory: ProductCategory; // original prisma enum
  subcategory: string | null;
  unitPrice: number | null;
  basePrice: number | null;
  pricingMode: string;
  rfqThresholdQty: number | null;
  currency: string;
  stockQuantity: number;
  minOrderQty: number;
  unitOfMeasure: string;
  leadTimeDays: number;
  shelfLifeDays: number | null;
  temperatureReq: string | null;
  images: string[] | null;
  status: string;
  supplierId: string;
  supplierName: string;
  supplierTier: string;
  supplierRating: number;
  supplierReviewCount: number;
  supplierCity: string;
  /** Distinguishes a supplier offer from a public market reference. */
  listingKind?: "SUPPLIER_OFFER" | "MARKET_REFERENCE";
  /** Number of independent source observations behind a market reference. */
  sourceCount?: number;
  /** Public source page retained for traceability; never used as a supplier identity. */
  sourceUrl?: string | null;
  imageRightsStatus?: string | null;
}

/** Transform a Prisma Product (with supplier) into a marketplace-compatible product */
export function transformToMarketplaceProduct(
  product: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    category: ProductCategory;
    subcategory: string | null;
    unitPrice: number | { valueOf(): number } | null;
    basePrice: number | { valueOf(): number } | null;
    pricingMode: string;
    rfqThresholdQty: number | null;
    currency: string;
    stockQuantity: number;
    minOrderQty: number;
    unitOfMeasure: string;
    leadTimeDays: number;
    shelfLifeDays: number | null;
    temperatureReq: string | null;
    images: string | null;
    status: string;
    supplierId: string;
    supplier: {
      id?: string;
      name: string;
      tier: string | { valueOf(): string };
      rating: number | null;
      reviewCount: number | null;
      city: string;
    } | null;
  }
): MarketplaceProduct {
  const imagesParsed = product.images
    ? (JSON.parse(product.images) as string[])
    : null;

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: toMarketplaceCategory(product.category),
    prismaCategory: product.category,
    subcategory: product.subcategory,
    unitPrice: product.unitPrice == null ? null : Number(product.unitPrice),
    basePrice: product.basePrice == null ? null : Number(product.basePrice),
    pricingMode: product.pricingMode,
    rfqThresholdQty: product.rfqThresholdQty,
    currency: product.currency,
    stockQuantity: product.stockQuantity,
    minOrderQty: product.minOrderQty,
    unitOfMeasure: product.unitOfMeasure,
    leadTimeDays: product.leadTimeDays,
    shelfLifeDays: product.shelfLifeDays,
    temperatureReq: product.temperatureReq,
    images: imagesParsed,
    status: product.status,
    supplierId: product.supplierId,
    supplierName: product.supplier?.name || "Unknown Supplier",
    supplierTier: String(product.supplier?.tier ?? "CORE"),
    supplierRating: product.supplier?.rating ?? 0,
    supplierReviewCount: product.supplier?.reviewCount ?? 0,
    supplierCity: product.supplier?.city || "",
    listingKind: "SUPPLIER_OFFER",
  };
}

/** Batch transform products */
export function transformManyToMarketplace(
  products: Parameters<typeof transformToMarketplaceProduct>[0][]
): MarketplaceProduct[] {
  return products.map(transformToMarketplaceProduct);
}

/**
 * Map an observed catalogue item into the same read shape as a supplier offer.
 *
 * A market reference is intentionally quote-only: it has no supplier account,
 * price, inventory, SKU, or orderable state. This lets the sourcing catalogue
 * show real demand candidates without presenting an unclaimed source as a
 * verified seller or fabricating commercial terms.
 */
export function transformCatalogItemToMarketplaceProduct(item: {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  unitOfMeasure: string | null;
  description: string | null;
  status: string;
  imageUrl: string | null;
  imageRightsStatus: string | null;
  sources?: Array<{ sourceUrl: string }>;
}): MarketplaceProduct {
  const sourceUrl = item.sources?.[0]?.sourceUrl ?? null;
  const category = item.category.toLowerCase();
  const marketplaceCategory = category.includes("food") || category.includes("beverage")
    ? "fb"
    : category.includes("housekeeping") || category.includes("cleaning")
      ? "hk"
      : category.includes("linen") || category.includes("textile")
        ? "lin"
        : category.includes("guest") || category.includes("amenit")
          ? "gra"
          : category.includes("engineering") || category.includes("maintenance") || category.includes("utilit")
            ? "eng"
            : category.includes("facilit") || category.includes("recreation") || category.includes("pool")
              ? "spa"
              : "unclassified";

  return {
    id: item.id,
    sku: "",
    name: item.name,
    description: item.description,
    category: marketplaceCategory,
    prismaCategory: toPrismaCategory(marketplaceCategory),
    subcategory: item.subcategory,
    unitPrice: null,
    basePrice: null,
    pricingMode: "RFQ",
    rfqThresholdQty: null,
    currency: "EGP",
    stockQuantity: 0,
    minOrderQty: 1,
    unitOfMeasure: item.unitOfMeasure || "unit",
    leadTimeDays: 0,
    shelfLifeDays: null,
    temperatureReq: null,
    images: item.imageRightsStatus === "APPROVED" && item.imageUrl ? [item.imageUrl] : null,
    status: item.status,
    supplierId: "",
    supplierName: "Market reference · supplier not onboarded",
    supplierTier: "UNVERIFIED",
    supplierRating: 0,
    supplierReviewCount: 0,
    supplierCity: "",
    listingKind: "MARKET_REFERENCE",
    sourceCount: item.sources?.length ?? 0,
    sourceUrl,
    imageRightsStatus: item.imageRightsStatus,
  };
}
