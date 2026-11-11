import { decodeEntities } from "@/lib/catalog/firecrawl-pipeline";
import { publicDirectoryText } from "@/lib/directory/public-directory-profile";

const STOP_TOKENS = new Set([
  "and", "co", "company", "distribution", "egyptian", "food", "for", "group",
  "hotel", "hotels", "inc", "industries", "limited", "llc", "ltd", "supply", "supplies", "the",
]);

/** Company-name tokens that must not remain on a buyer-facing product row. */
export function supplierNameTokens(supplierName: string): string[] {
  return supplierName
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_TOKENS.has(token.toLocaleLowerCase("en")));
}

/**
 * Product title for the hotel list. The selling company and any printed price
 * are removed. The commercial product name stays.
 */
export function maskedPublicProductName(name: string, supplierName: string): string | null {
  let value = decodeEntities(name).replace(/<[^>]+>/g, " ");
  for (const token of supplierNameTokens(supplierName)) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    value = value.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
  }
  value = value
    .replace(/\b(?:egp|usd|le)\s*[\d.,]+|[\d.,]+\s*(?:egp|جنيه)/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,&])/g, "$1")
    .trim();
  return publicDirectoryText(value);
}

/** Pack size printed on the product title, such as "105 Gm". */
export function observedPackSize(name: string): string | null {
  const match = decodeEntities(name).match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gm|ml|l|ltr|litre|liter|pcs|pc)\b/i);
  return match ? `${match[1]} ${match[2]}` : null;
}
