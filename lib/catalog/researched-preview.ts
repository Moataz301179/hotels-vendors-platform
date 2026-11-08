import { createHash } from "node:crypto";
import pilot from "@/lib/catalog/data/egyptian-hospitality-pilot.v1.json";

const categoryMap: Record<string, 'FOOD_BEVERAGE' | 'HOUSEKEEPING' | 'GUEST_SUPPLIES'> = {
  "Food & Beverage": "FOOD_BEVERAGE",
  "Housekeeping & Cleaning": "HOUSEKEEPING",
  "Guest Amenities": "GUEST_SUPPLIES",
} as const;

export type ResearchedPreview = ReturnType<typeof researchedCatalogPreviews>[number];

export function researchedCatalogPreviews() {
  return pilot.products.map((product) => ({
    id: `research-${createHash("sha256").update(`${product.product_page_url}\0${product.product_name}`).digest("hex").slice(0, 20)}`,
    itemType: "PRODUCT",
    name: product.product_name,
    category: categoryMap[product.category],
    sourceCategory: product.category,
    subcategory: product.subcategory,
    unitOfMeasure: product.unit_of_measure || "Not published by source",
    packSize: product.pack_size || "Supplier confirmation required",
    image: product.direct_image_url,
    description: product.description,
    specifications: product.specifications,
    previewStatus: "RESEARCHED_PREVIEW" as const,
    confirmationStatus: "UNCONFIRMED" as const,
    lifecycleStatus: "DRAFT" as const,
    transactionEligible: false as const,
    rejectionReasons: ["SUPPLIER_CONFIRMATION_REQUIRED"] as const,
    internalEvidence: {
      supplierOrCatalog: product.supplier_or_catalog_name,
      sourceUrl: product.product_page_url,
      imageRightsNote: product.image_rights_note,
      observedAt: product.source_observed_at,
      evidenceNotes: product.evidence_notes,
    },
  }));
}

export function researchedCatalogPreview(id: string) {
  return researchedCatalogPreviews().find((product) => product.id === id) ?? null;
}
