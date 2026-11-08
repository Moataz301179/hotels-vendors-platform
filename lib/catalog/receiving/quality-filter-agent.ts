import type { QualityDecision, RawCatalogObservation } from "./types";

export const QUALITY_FILTER_AGENT_VERSION = "hv-quality-filter-rules-v1";

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
function sameSite(left: URL, right: URL): boolean {
  const host = (value: string) => value.toLocaleLowerCase("en").replace(/^www\./, "");
  const a = host(left.hostname); const b = host(right.hostname);
  return a === b || a.endsWith("." + b) || b.endsWith("." + a);
}
const navigationOnlyTitle = /^(home|shop|products?|catalog(?:ue)?|categories|all categories|hotel supplies|view all|read more|our products|featured products|latest products)$/i;
const lowValuePattern = /\b(cookie policy|privacy policy|terms and conditions|newsletter|subscribe now|contact us|about us|careers|job vacancies)\b/i;

/** Subagent 1: product-vs-noise filtering, duplicate detection and evidence flags. */
export function runQualityFilterAgent(
  observation: RawCatalogObservation,
  options: { duplicateInBatch?: boolean } = {},
): QualityDecision {
  const name = clean(observation.name);
  const reasons: string[] = [];
  const flags: string[] = [];
  const sourceUrl = validHttpUrl(observation.sourceUrl);
  const productUrl = validHttpUrl(observation.productUrl);
  let sourceHost = "unknown-source";
  try { sourceHost = new URL(observation.sourceUrl).hostname; } catch { /* invalid source handled below */ }
  const supplierKey = normalized(clean(observation.supplierWebsite) || clean(observation.supplierName) || sourceHost);
  const productKey = clean(observation.externalId) || clean(observation.sku) || clean(observation.productUrl) || normalized(name);
  const dedupeKey = normalized([supplierKey, productKey].join("|"));

  if (options.duplicateInBatch) {
    return { status: "DUPLICATE", reasons: ["Repeated supplier/product identity within this intake batch."], flags: ["DUPLICATE_SOURCE_ROW"], dedupeKey };
  }
  if (name.length < 3 || navigationOnlyTitle.test(name) || lowValuePattern.test(name)) {
    return { status: "REJECTED", reasons: ["The observation does not identify an individual product."], flags: ["NON_PRODUCT_PAGE"], dedupeKey };
  }
  if (!sourceUrl) {
    return { status: "REJECTED", reasons: ["A valid HTTP(S) source page is missing."], flags: ["SOURCE_URL_MISSING"], dedupeKey };
  }
  if (!clean(observation.supplierName)) flags.push("SUPPLIER_IDENTITY_NOT_OBSERVED");
  if (!clean(observation.sku) && !clean(observation.externalId)) flags.push("SOURCE_SKU_NOT_OBSERVED");
  if (!clean(observation.packSize)) flags.push("PACK_SPECIFICATION_NOT_OBSERVED");
  if (!clean(observation.unitOfMeasure)) flags.push("UNIT_OF_MEASURE_NOT_OBSERVED");
  if (!observation.images?.some((image) => Boolean(validHttpUrl(image)))) flags.push("PRODUCT_IMAGE_NOT_OBSERVED");
  if (observation.unitPrice === null || observation.unitPrice === undefined) flags.push("PRICE_NOT_OBSERVED");
  if (!productUrl) {
    flags.push("PRODUCT_DETAIL_URL_NOT_OBSERVED");
    reasons.push("No individual product detail URL was captured.");
    return { status: "REVIEW_REQUIRED", reasons, flags, dedupeKey };
  }
  if (!sameSite(sourceUrl, productUrl)) {
    flags.push("PRODUCT_URL_OFF_SOURCE_SITE");
    reasons.push("The product URL is outside the submitted source site and requires review.");
    return { status: "REVIEW_REQUIRED", reasons, flags, dedupeKey };
  }
  if (productUrl.href === sourceUrl.href && !clean(observation.sku) && !clean(observation.externalId)) {
    flags.push("CATALOG_PAGE_NOT_PRODUCT_PAGE");
    reasons.push("The captured URL is the catalog landing page, not a uniquely identified product page.");
    return { status: "REVIEW_REQUIRED", reasons, flags, dedupeKey };
  }
  return { status: "ACCEPTED", reasons: ["Individual product identity and same-site detail URL observed."], flags, dedupeKey };
}
