import type { QualityDecision, RawCatalogObservation } from "./types";

export const QUALITY_FILTER_AGENT_VERSION = "hv-quality-filter-rules-v2";

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
function normalized(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function validHttpUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch { return null; }
}
const navigationOnlyTitle = /^(home|shop|products?|catalog(?:ue)?|categories|all categories|hotel supplies|view all|read more|our products|featured products|latest products|contact|about us|search results)$/i;
const lowValuePattern = /\b(cookie policy|privacy policy|terms and conditions|newsletter|subscribe now|careers|job vacancies)\b/i;

/**
 * Agent 1 classifies actual product observations versus navigation/noise.
 * Missing price, SKU, pack, UOM, brand, image, description, MOQ, stock,
 * technical specification, or product-detail URL are enrichment flags only.
 * A record with a real product identity may proceed without them.
 */
export function runQualityFilterAgent(
  observation: RawCatalogObservation,
  options: { duplicateInBatch?: boolean } = {},
): QualityDecision {
  const name = clean(observation.name);
  const reasons: string[] = [];
  const flags: string[] = [];
  const sourceUrl = validHttpUrl(observation.sourceUrl);
  const supplierKey = normalized(clean(observation.supplierWebsite) || clean(observation.supplierName) || (() => {
    try { return new URL(observation.sourceUrl).hostname; } catch { return ""; }
  })());
  const productKey = clean(observation.externalId) || clean(observation.sku) || clean(observation.productUrl) || normalized(name);
  const dedupeKey = normalized([supplierKey, productKey].join("|"));

  if (options.duplicateInBatch) {
    return { status: "DUPLICATE", reasons: ["Same supplier/product identity already exists in this intake batch."], flags: ["DUPLICATE_SOURCE_ROW"], dedupeKey };
  }
  if (name.length < 2 || navigationOnlyTitle.test(name) || lowValuePattern.test(name)) {
    return { status: "REJECTED", reasons: ["The observation is navigation, marketing, or does not identify a product."], flags: ["NON_PRODUCT_OBSERVATION"], dedupeKey };
  }
  if (!sourceUrl) {
    return { status: "REVIEW_REQUIRED", reasons: ["A valid source URL is needed to trace this observation."], flags: ["SOURCE_URL_MISSING"], dedupeKey };
  }

  if (!clean(observation.supplierName)) flags.push("SUPPLIER_IDENTITY_NOT_OBSERVED");
  if (!clean(observation.sku) && !clean(observation.externalId)) flags.push("SKU_NOT_OBSERVED");
  if (!clean(observation.packSize)) flags.push("PACK_SIZE_NOT_OBSERVED");
  if (!clean(observation.unitOfMeasure) && !clean(observation.purchaseUnit)) flags.push("UNIT_OF_MEASURE_NOT_OBSERVED");
  if (!clean(observation.brand)) flags.push("BRAND_NOT_OBSERVED");
  if (!clean(observation.description)) flags.push("DESCRIPTION_NOT_OBSERVED");
  if (!clean(observation.category)) flags.push("SOURCE_CATEGORY_NOT_OBSERVED");
  if (observation.unitPrice === null || observation.unitPrice === undefined) flags.push("PRICE_NOT_OBSERVED");
  if (!observation.stockText) flags.push("STOCK_NOT_OBSERVED");
  if (!observation.images?.length) flags.push("PRODUCT_IMAGE_NOT_OBSERVED");
  if (!validHttpUrl(observation.productUrl)) flags.push("PRODUCT_DETAIL_URL_NOT_OBSERVED");
  if (observation.attributes && !Object.keys(observation.attributes).length) flags.push("TECHNICAL_SPECIFICATIONS_NOT_OBSERVED");

  const productUrl = validHttpUrl(observation.productUrl);
  if (productUrl && sourceUrl && productUrl.hostname !== sourceUrl.hostname &&
      !productUrl.hostname.endsWith("." + sourceUrl.hostname) &&
      !sourceUrl.hostname.endsWith("." + productUrl.hostname)) {
    flags.push("PRODUCT_DETAIL_URL_OFF_SOURCE_SITE");
  }

  return {
    status: "ACCEPTED",
    reasons: ["Product name and traceable source are present. Missing commercial or technical fields do not block intake."],
    flags,
    dedupeKey,
  };
}
