/**
 * SKU Generator — AI Agent for GS1-compatible SKU creation
 * Uses Ollama (local) via executeLLM
 */

import { executeLLM } from "@/lib/ai/llm";

export interface SkuGenerationInput {
  productName: string;
  category: string;
  subcategory?: string;
  brand?: string;
  keySpecs?: string;       // e.g., "3kg", "queen", "30ml", "10 inch"
  supplierPrefix?: string; // e.g., "HNZ", "ALZ", "UNI", "ETT"
}

export interface SkuGenerationResult {
  sku: string;
  confidence: number;      // 0-1
  reasoning: string;
  alternatives: string[];  // Fallback SKUs
}

/**
 * Build the system prompt for SKU generation
 */
function buildSystemPrompt(): string {
  return `You are an expert in GS1-compatible SKU generation for Egyptian hospitality procurement.
Generate SKUs that are:
- Human-readable and scannable
- Hierarchical: CATEGORY-BRAND-SPEC-VARIANT
- Max 20 characters, alphanumeric + hyphens only
- Consistent within a supplier's catalog

CATEGORY PREFIXES (3-4 chars):
- FNB  = Food & Beverage
- CNS  = Consumables (linens, chemicals, janitorial)
- AMN  = Guest Supplies (amenities, comfort items)
- FFE  = Furniture, Fixtures & Equipment
- SRV  = Services

BRAND PREFIXES (3-4 chars, derive from name):
- HNZ  = Heinz
- ALZ  = Al Azima
- UNI  = Universal
- ETT  = ETTC Egypt
- KFF  = KFF
- FTR  = Fighter Flash
- HLL  = Hellen's
- SAI  = SAI Solutions

EXAMPLES:
- "Heinz Classic Mayonnaise 3kg" → FNB-HNZ-MAY-3KG-001
- "100% Cotton Bed Sheet - Queen" → CNS-ALZ-BED-QN-001
- "Shampoo 30ml - Premium" → AMN-UNI-SHP-30ML-001
- "Porcelain Dinner Plate 10 inch" → FFE-ETT-PLT-10IN-001
- "All-Purpose Cleaner 1L" → CNS-FTR-CLN-1L-001

OUTPUT FORMAT (JSON only):
{
  "sku": "FNB-HNZ-MAY-3KG-001",
  "confidence": 0.95,
  "reasoning": "Category F&B, brand Heinz, product mayo, spec 3kg, variant 001",
  "alternatives": ["FNB-HNZ-MAY-3KG", "FNB-HEINZ-MAYO-3KG"]
}`;
}

/**
 * Generate a GS1-compatible SKU for a product
 */
export async function generateSku(input: SkuGenerationInput): Promise<SkuGenerationResult> {
  const systemPrompt = buildSystemPrompt();

  const userPrompt = `Product: "${input.productName}"
Category: ${input.category}
${input.subcategory ? `Subcategory: ${input.subcategory}` : ""}
${input.brand ? `Brand: ${input.brand}` : ""}
${input.keySpecs ? `Key Specs: ${input.keySpecs}` : ""}
${input.supplierPrefix ? `Supplier Prefix: ${input.supplierPrefix}` : ""}

Generate SKU as JSON.`;

  const result = await executeLLM(
    systemPrompt,
    userPrompt,
    { temperature: 0.2, maxTokens: 300, jsonMode: true, taskComplexity: "simple" }
  );

  try {
    const parsed = JSON.parse(result.content);
    return {
      sku: parsed.sku || fallbackSku(input),
      confidence: Math.min(Math.max(parsed.confidence ?? 0.5, 0), 1),
      reasoning: parsed.reasoning || "Generated via fallback",
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
    };
  } catch {
    // Fallback if JSON parsing fails
    const fallback = fallbackSku(input);
    return {
      sku: fallback,
      confidence: 0.4,
      reasoning: "LLM response parsing failed; used deterministic fallback",
      alternatives: [fallback.replace(/-001$/, ""), fallback.replace(/-001$/, "-002")],
    };
  }
}

/**
 * Deterministic fallback SKU generator (no LLM needed)
 */
function fallbackSku(input: SkuGenerationInput): string {
  const catPrefix = categoryPrefix(input.category);
  const brandPrefix = input.supplierPrefix || brandPrefixFromName(input.productName);
  const specCode = extractSpecCode(input.productName, input.keySpecs);
  const variant = "001";

  return `${catPrefix}-${brandPrefix}-${specCode}-${variant}`.toUpperCase();
}

function categoryPrefix(category: string): string {
  const cat = category.toUpperCase().replace(/[&\s]/g, "_");
  switch (cat) {
    case "F_AND_B":
    case "FOOD":
    case "BEVERAGE":
      return "FNB";
    case "CONSUMABLES":
    case "HOUSEKEEPING":
    case "LINEN":
    case "CHEMICALS":
    case "JANITORIAL":
      return "CNS";
    case "GUEST_SUPPLIES":
    case "AMENITIES":
    case "COMFORT":
      return "AMN";
    case "FFE":
    case "FURNITURE":
    case "EQUIPMENT":
    case "FIXTURES":
      return "FFE";
    case "SERVICES":
    case "MAINTENANCE":
    case "CONSULTING":
      return "SRV";
    default:
      return "GEN";
  }
}

function brandPrefixFromName(name: string): string {
  // Extract first 3-4 consonants from first significant word
  const words = name.split(/\s+/).filter(w => w.length > 2);
  for (const word of words) {
    const consonants = word.replace(/[aeiouAEIOU]/g, "").toUpperCase();
    if (consonants.length >= 3) {
      return consonants.slice(0, 4);
    }
  }
  return "BRD";
}

function extractSpecCode(name: string, keySpecs?: string): string {
  // Try to extract size/quantity from name or keySpecs
  const text = (keySpecs || name).toUpperCase();
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(KG|G|L|ML|M|CM|MM|IN|INCH|PCS?|PC|SET|BOX|CASE|PACK|JAR|CAN|BTL|BOTTLE|BAG|ROLL|PAIR|KIT)\b/,
    /(\d+(?:\.\d+)?)\s*(KG|G|L|ML)\b/,
    /(QUEEN|KING|TWIN|SINGLE|DOUBLE|FULL)\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = match[1];
      const unit = match[2] || "";
      return `${num}${unit}`.replace(/\s+/g, "");
    }
  }

  // Fallback: first 4 chars of first meaningful word
  const words = name.split(/\s+/).filter(w => w.length > 2);
  return words[0]?.slice(0, 4).toUpperCase() || "ITEM";
}

/**
 * Batch generate SKUs for multiple products
 */
export async function generateSkusBatch(inputs: SkuGenerationInput[]): Promise<SkuGenerationResult[]> {
  // Process in parallel with concurrency limit
  const concurrency = 3;
  const results: SkuGenerationResult[] = [];

  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(generateSku));
    results.push(...batchResults);
  }

  return results;
}