import { decodeEntities } from "@/lib/catalog/firecrawl-pipeline";
import { publicDirectoryText } from "@/lib/directory/public-directory-profile";

const STOP_TOKENS = new Set([
  "and", "co", "company", "distribution", "egyptian", "food", "for", "group",
  "hotel", "hotels", "inc", "industries", "limited", "llc", "ltd", "supply", "supplies", "the",
]);

function identityText(value: string): string {
  return value.normalize("NFKC");
}

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A letter or number on either side keeps this from matching inside another word. */
function identityPattern(token: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped(token)}(?![\\p{L}\\p{N}])`, "giu");
}

/** Company-name tokens that must not remain on a buyer-facing product row. */
export function supplierNameTokens(supplierName: string): string[] {
  const seen = new Set<string>();
  return identityText(supplierName)
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => {
      const key = token.toLocaleLowerCase("en");
      if (token.length < 2 || STOP_TOKENS.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => right.length - left.length);
}

export function retainsSupplierIdentity(value: string, supplierName: string): boolean {
  const text = identityText(value);
  return supplierNameTokens(supplierName).some((token) => identityPattern(token).test(text));
}

/**
 * Product title for the hotel list. The selling company and any printed price
 * are removed. The commercial product name stays. A title that still contains
 * the company is withheld.
 */
export function maskedPublicProductName(name: string, supplierName: string): string | null {
  let value = identityText(decodeEntities(name).replace(/<[^>]+>/g, " "));
  for (const token of supplierNameTokens(supplierName)) value = value.replace(identityPattern(token), " ");
  value = value
    .replace(/(?<![\p{L}\p{N}])(?:egp|usd|le)\s*[\d.,]+|[\d.,]+\s*(?:egp|جنيه)(?![\p{L}\p{N}])/giu, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,&])/g, "$1")
    .trim();
  if (!value || retainsSupplierIdentity(value, supplierName)) return null;
  return publicDirectoryText(value);
}

/** Pack size printed on the product title, such as "105 Gm". */
export function observedPackSize(name: string): string | null {
  const match = decodeEntities(name).match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gm|ml|l|ltr|litre|liter|pcs|pc)\b/i);
  return match ? `${match[1]} ${match[2]}` : null;
}
