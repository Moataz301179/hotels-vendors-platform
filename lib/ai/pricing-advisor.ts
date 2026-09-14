/**
 * Pricing Advisor — AI Agent for tier pricing + promotional suggestions
 * Uses Ollama (local) via executeLLM
 */

import { executeLLM } from "@/lib/ai/llm";

export interface PricingInput {
  productName: string;
  category: string;
  subcategory?: string;
  costPrice?: number;          // Supplier's cost (if known)
  suggestedRetail?: number;    // Current/list price
  competitorPrices?: number[]; // Known competitor prices
  volumeTiers?: { minQty: number; maxQty?: number }[]; // e.g., [{minQty:1}, {minQty:11}, {minQty:51}]
  seasonality?: "high" | "low" | "stable"; // Oct-Apr high, May-Sep low for Red Sea
  brandTier?: "premium" | "standard" | "economy";
}

export interface TierPrice {
  minQty: number;
  maxQty?: number;      // undefined = no upper bound
  unitPrice: number;    // EGP
  marginPct?: number;   // Calculated if costPrice provided
  label: string;        // e.g., "1-10", "11-50", "51+"
}

export interface PromoSuggestion {
  name: string;              // e.g., "Ramadan Linen Bundle"
  description: string;
  discountType: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
  discountValue: number;     // % or EGP
  minQty?: number;
  validFrom: string;         // ISO date
  validUntil: string;        // ISO date
  targetCategories: string[]; // Hotel tiers: CORE, PREMIER, COASTAL
  confidence: number;
}

export interface PricingOutput {
  tierPrices: TierPrice[];
  promoSuggestions: PromoSuggestion[];
  recommendedRetail: number; // Single recommended list price
  reasoning: string;
  confidence: number;
}

/**
 * Build system prompt for pricing intelligence
 */
function buildSystemPrompt(): string {
  return `You are a pricing strategist for Egyptian hospitality wholesale.
Analyze costs, competition, and market dynamics to recommend tier pricing and promotions.

MARKET CONTEXT:
- Primary buyers: Red Sea coastal hotels (Sharm El-Sheikh, Hurghada) — 100-500 rooms
- Secondary: Cairo, Alexandria, North Coast chains
- Seasonality: HIGH Oct-Apr (peak occupancy), LOW May-Sep (30-50% occupancy drop)
- Payment terms: Net-30 to Net-60 standard; factoring via Oliv pays suppliers Day 1 (2-3% discount)
- Categories: F&B (high volume, low margin 15-25%), Consumables (med margin 25-35%),
  Guest Supplies (higher margin 35-50%), FF& E (high ticket, 30-40%), Services (variable)

PRICING RULES:
- Tier 1 (1-10): List price, covers small/emergency orders
- Tier 2 (11-50): 5-12% discount for regular weekly orders
- Tier 3 (51+): 10-20% discount for monthly/contract volumes
- Always round to nearest 5 or 10 EGP for clean pricing
- If costPrice known: ensure Tier 3 margin >= 12% (after factoring discount)

PROMOTIONAL CALENDAR:
- Ramadan (Mar/Apr): F&B bundles, guest amenities refresh
- Summer (May-Sep): Deep discounts on linens, chemicals, FF&E to move stock
- Back-to-School (Sep): Kitchen equipment, tableware refresh
- Eid (variable): Guest supplies, amenities gift sets

OUTPUT FORMAT (JSON only):
{
  "tierPrices": [
    {"minQty": 1, "maxQty": 10, "unitPrice": 387, "marginPct": 22.5, "label": "1-10"},
    {"minQty": 11, "maxQty": 50, "unitPrice": 355, "marginPct": 13.8, "label": "11-50"},
    {"minQty": 51, "maxQty": null, "unitPrice": 320, "marginPct": 3.2, "label": "51+"}
  ],
  "promoSuggestions": [
    {
      "name": "Ramadan Mayo Bundle",
      "description": "Buy 10+ jars Heinz Mayo 3kg, get 5% off + free Shark-Breaker delivery",
      "discountType": "percentage",
      "discountValue": 5,
      "minQty": 10,
      "validFrom": "2026-03-10",
      "validUntil": "2026-04-10",
      "targetCategories": ["CORE", "PREMIER", "COASTAL"],
      "confidence": 0.85
    }
  ],
  "recommendedRetail": 387,
  "reasoning": "Cost 300 EGP, competitor 380-410. Tier 3 at 320 maintains 6.7% post-factoring margin. Ramadan promo aligns with F&B peak.",
  "confidence": 0.88
}`;
}

/**
 * Generate tier pricing and promotional suggestions
 */
export async function generatePricing(input: PricingInput): Promise<PricingOutput> {
  const systemPrompt = buildSystemPrompt();

  const userPrompt = `Product: "${input.productName}"
Category: ${input.category}
${input.subcategory ? `Subcategory: ${input.subcategory}` : ""}
${input.costPrice !== undefined ? `Cost Price: ${input.costPrice} EGP` : ""}
${input.suggestedRetail !== undefined ? `Current/List Price: ${input.suggestedRetail} EGP` : ""}
${input.competitorPrices && input.competitorPrices.length > 0 ? `Competitor Prices: ${input.competitorPrices.join(", ")} EGP` : ""}
${input.volumeTiers && input.volumeTiers.length > 0 ? `Volume Tiers: ${JSON.stringify(input.volumeTiers)}` : ""}
${input.seasonality ? `Seasonality: ${input.seasonality}` : ""}
${input.brandTier ? `Brand Tier: ${input.brandTier}` : ""}

Generate pricing as JSON.`;

  const result = await executeLLM(
    systemPrompt,
    userPrompt,
    { temperature: 0.3, maxTokens: 800, jsonMode: true, taskComplexity: "medium" }
  );

  try {
    const parsed = JSON.parse(result.content);
    return {
      tierPrices: normalizeTierPrices(parsed.tierPrices, input),
      promoSuggestions: normalizePromos(parsed.promoSuggestions, input),
      recommendedRetail: parsed.recommendedRetail || input.suggestedRetail || fallbackRetail(input),
      reasoning: parsed.reasoning || "Generated via fallback logic",
      confidence: Math.min(Math.max(parsed.confidence ?? 0.7, 0), 1),
    };
  } catch {
    return fallbackPricing(input);
  }
}

/**
 * Normalize and validate tier prices
 */
function normalizeTierPrices(tiers: unknown[], input: PricingInput): TierPrice[] {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return fallbackTiers(input);
  }

  const defaultTiers = [
    { minQty: 1, maxQty: 10 },
    { minQty: 11, maxQty: 50 },
    { minQty: 51, maxQty: undefined },
  ];

  return tiers.map((t, i) => {
    const tier = t as Record<string, unknown>;
    const def = defaultTiers[i] || { minQty: 1, maxQty: undefined };
    const price = typeof tier.unitPrice === "number" ? tier.unitPrice :
      typeof tier.price === "number" ? tier.price :
        input.suggestedRetail || fallbackRetail(input);

    // Round to nearest 5 EGP
    const rounded = Math.round(price / 5) * 5;

    return {
      minQty: typeof tier.minQty === "number" ? tier.minQty : def.minQty,
      maxQty: tier.maxQty === null || tier.maxQty === undefined ? undefined :
        typeof tier.maxQty === "number" ? tier.maxQty : def.maxQty,
      unitPrice: rounded,
      marginPct: typeof tier.marginPct === "number" ? tier.marginPct :
        input.costPrice ? Math.round(((rounded - input.costPrice) / input.costPrice) * 100 * 10) / 10 : undefined,
      label: typeof tier.label === "string" && tier.label
        ? tier.label
        : `${def.minQty}${def.maxQty ? `-${def.maxQty}` : "+"}`,
    };
  });
}

/**
 * Normalize promotional suggestions
 */
function normalizePromos(promos: unknown[], input: PricingInput): PromoSuggestion[] {
  if (!Array.isArray(promos)) return fallbackPromos(input);

  const now = new Date();
  const ramadanStart = new Date("2026-03-10");
  const ramadanEnd = new Date("2026-04-10");
  const summerStart = new Date("2026-05-01");
  const summerEnd = new Date("2026-09-30");

  return promos.map((p) => {
    const promo = p as Record<string, unknown>;
    return {
      name: typeof promo.name === "string" ? promo.name : "Seasonal Promotion",
      description: typeof promo.description === "string" ? promo.description : "",
      discountType: ["percentage", "fixed_amount", "buy_x_get_y", "free_shipping"].includes(promo.discountType as string)
        ? promo.discountType as PromoSuggestion["discountType"] : "percentage",
      discountValue: typeof promo.discountValue === "number" ? promo.discountValue : 10,
      minQty: typeof promo.minQty === "number" ? promo.minQty : 10,
      validFrom: typeof promo.validFrom === "string" ? promo.validFrom :
        (input.seasonality === "high" ? ramadanStart.toISOString().split("T")[0] : summerStart.toISOString().split("T")[0]),
      validUntil: typeof promo.validUntil === "string" ? promo.validUntil :
        (input.seasonality === "high" ? ramadanEnd.toISOString().split("T")[0] : summerEnd.toISOString().split("T")[0]),
      targetCategories: Array.isArray(promo.targetCategories) ? promo.targetCategories : ["CORE", "PREMIER", "COASTAL"],
      confidence: Math.min(Math.max(typeof promo.confidence === "number" ? promo.confidence : 0.6, 0), 1),
    };
  }).slice(0, 3); // Max 3 promos
}

/**
 * Batch generate pricing
 */
export async function generatePricingBatch(inputs: PricingInput[]): Promise<PricingOutput[]> {
  const concurrency = 2;
  const results: PricingOutput[] = [];

  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(generatePricing));
    results.push(...batchResults);
  }

  return results;
}

// ============ FALLBACKS ============

function fallbackRetail(input: PricingInput): number {
  if (input.suggestedRetail) return input.suggestedRetail;
  if (input.costPrice) return Math.round(input.costPrice * 1.35 / 5) * 5; // 35% markup
  return 100; // Default
}

function fallbackTiers(input: PricingInput): TierPrice[] {
  const retail = fallbackRetail(input);
  return [
    { minQty: 1, maxQty: 10, unitPrice: retail, marginPct: input.costPrice ? Math.round(((retail - input.costPrice) / input.costPrice) * 100 * 10) / 10 : undefined, label: "1-10" },
    { minQty: 11, maxQty: 50, unitPrice: Math.round(retail * 0.92 / 5) * 5, marginPct: input.costPrice ? Math.round(((retail * 0.92 - input.costPrice) / input.costPrice) * 100 * 10) / 10 : undefined, label: "11-50" },
    { minQty: 51, maxQty: undefined, unitPrice: Math.round(retail * 0.82 / 5) * 5, marginPct: input.costPrice ? Math.round(((retail * 0.82 - input.costPrice) / input.costPrice) * 100 * 10) / 10 : undefined, label: "51+" },
  ];
}

function fallbackPromos(input: PricingInput): PromoSuggestion[] {
  const now = new Date();
  const isHighSeason = now.getMonth() >= 9 || now.getMonth() <= 3; // Oct-Apr

  if (isHighSeason) {
    return [{
      name: "Ramadan Hospitality Bundle",
      description: `Stock up on ${input.category.toLowerCase().replace("_", " ")} for Ramadan peak season`,
      discountType: "percentage",
      discountValue: 8,
      minQty: 20,
      validFrom: "2026-03-10",
      validUntil: "2026-04-10",
      targetCategories: ["CORE", "PREMIER", "COASTAL"],
      confidence: 0.7,
    }];
  } else {
    return [{
      name: "Summer Stock-Up Sale",
      description: `Deep discount on ${input.category.toLowerCase().replace("_", " ")} for low-season replenishment`,
      discountType: "percentage",
      discountValue: 15,
      minQty: 30,
      validFrom: "2026-05-01",
      validUntil: "2026-09-30",
      targetCategories: ["CORE", "PREMIER", "COASTAL"],
      confidence: 0.65,
    }];
  }
}

function fallbackPricing(input: PricingInput): PricingOutput {
  return {
    tierPrices: fallbackTiers(input),
    promoSuggestions: fallbackPromos(input),
    recommendedRetail: fallbackRetail(input),
    reasoning: "LLM unavailable; used cost-plus fallback with seasonal promo template",
    confidence: 0.4,
  };
}