export type RawCatalogObservation = {
  sourceUrl: string;
  productUrl?: string | null;
  sourceName: string;
  sourceType: string;
  supplierName?: string | null;
  supplierWebsite?: string | null;
  externalId?: string | null;
  sku?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  brand?: string | null;
  packSize?: string | null;
  unitOfMeasure?: string | null;
  purchaseUnit?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  stockText?: string | null;
  images?: string[];
  attributes?: Record<string, string | number | boolean>;
};

export type QualityDecision = {
  status: "ACCEPTED" | "REVIEW_REQUIRED" | "REJECTED" | "DUPLICATE";
  reasons: string[];
  flags: string[];
  dedupeKey: string;
};

export type TaxonomyDecision = {
  status: "MAPPED" | "REVIEW_REQUIRED";
  categoryCode: string | null;
  subcategoryCode: string | null;
  normalizedName: string;
  normalizedDescription: string;
  unitOfMeasure: string | null;
  purchaseUnit: string | null;
  specifications: Record<string, string | number>;
  reasons: string[];
};
