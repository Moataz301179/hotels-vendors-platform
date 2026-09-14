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
  unitPrice: number;
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
    unitPrice: number | { valueOf(): number };
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
    unitPrice: Number(product.unitPrice),
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
    supplierRating: product.supplier?.rating ?? 4.0,
    supplierReviewCount: product.supplier?.reviewCount ?? 0,
    supplierCity: product.supplier?.city || "Cairo",
  };
}

/** Batch transform products */
export function transformManyToMarketplace(
  products: Parameters<typeof transformToMarketplaceProduct>[0][]
): MarketplaceProduct[] {
  return products.map(transformToMarketplaceProduct);
}
