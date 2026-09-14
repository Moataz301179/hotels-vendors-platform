/**
 * Description Writer — AI Agent for Arabic/English SEO product descriptions
 * Uses Ollama (local) via executeLLM
 */

import { executeLLM } from "@/lib/ai/llm";

export interface DescriptionInput {
  productName: string;
  category: string;
  subcategory?: string;
  specs?: string;
  keyFeatures?: string[];
  brand?: string;
  targetAudience?: "hotel_procurement" | "general";
}

export interface DescriptionOutput {
  descriptionEn: string;      // English marketing description (150-300 chars)
  descriptionAr: string;      // Arabic marketing description (150-300 chars)
  shortDescriptionEn: string; // Short English (50-100 chars) for cards/lists
  shortDescriptionAr: string; // Short Arabic (50-100 chars) for cards/lists
  seoKeywordsEn: string[];    // 5-8 English keywords
  seoKeywordsAr: string[];    // 5-8 Arabic keywords
  confidence: number;
}

/**
 * Build system prompt for bilingual description generation
 */
function buildSystemPrompt(): string {
  return `You are a bilingual (English/Arabic) product copywriter for Egyptian hospitality procurement.
Write compelling, SEO-optimized descriptions for hotel supply products.

RULES:
- English: Professional, concise, benefit-focused. 150-300 chars for full, 50-100 for short.
- Arabic: Natural Egyptian business Arabic (not translated word-for-word). Same length.
- Include key specs naturally (size, material, certifications, pack size).
- Target audience: Hotel procurement managers, executive chefs, housekeeping directors.
- Keywords: Mix of product terms + hospitality context (hotel, restaurant, resort, bulk, commercial).
- Brand names (Hotels Vendors, Oliv, Invo) stay in ENGLISH — never transliterate.
- No markdown, no bullet points in descriptions — plain text paragraphs.

CATEGORY TONES:
- F_AND_B: Appetizing, quality-focused, kitchen-efficiency
- CONSUMABLES: Durability, cost-per-use, hygiene standards
- GUEST_SUPPLIES: Guest experience, premium feel, brandable
- FFE: Longevity, design, commercial-grade, warranty
- SERVICES: Reliability, compliance, expertise, SLA

OUTPUT FORMAT (JSON only):
{
  "descriptionEn": "Premium Egyptian cotton bed sheet, queen size, 300 thread count. White, hypoallergenic, commercial laundry tested for 200+ cycles. Ideal for 4-5 star hotels and resorts.",
  "descriptionAr": "مفرش سرير قطن مصري 100%، مقاس كوين، 300 خيط. أبيض، مضاد للحساسية، تم اختباره للغسيل التجاري 200+ دورة. مثالي للفنادق والمنتجعات 4-5 نجوم.",
  "shortDescriptionEn": "Egyptian cotton queen sheet, 300 TC, hotel-grade",
  "shortDescriptionAr": "مفرش قطن مصري كوين 300 خيط، درجة فندقية",
  "seoKeywordsEn": ["egyptian cotton bed sheet", "queen bedding", "hotel linens", "commercial laundry", "300 thread count"],
  "seoKeywordsAr": ["مفرش قطن مصري", "مفروشات فنادق", "ملاءات كوين", "غسيل تجاري", "300 خيط"],
  "confidence": 0.92
}`;
}

/**
 * Generate bilingual SEO descriptions for a product
 */
export async function generateDescriptions(input: DescriptionInput): Promise<DescriptionOutput> {
  const systemPrompt = buildSystemPrompt();

  const userPrompt = `Product: "${input.productName}"
Category: ${input.category}
${input.subcategory ? `Subcategory: ${input.subcategory}` : ""}
${input.brand ? `Brand: ${input.brand}` : ""}
${input.specs ? `Specs: ${input.specs}` : ""}
${input.keyFeatures && input.keyFeatures.length > 0 ? `Key Features: ${input.keyFeatures.join(", ")}` : ""}
Target: ${input.targetAudience || "hotel_procurement"}

Generate bilingual descriptions as JSON.`;

  const result = await executeLLM(
    systemPrompt,
    userPrompt,
    { temperature: 0.4, maxTokens: 600, jsonMode: true, taskComplexity: "medium" }
  );

  try {
    const parsed = JSON.parse(result.content);
    return {
      descriptionEn: parsed.descriptionEn || fallbackEn(input),
      descriptionAr: parsed.descriptionAr || fallbackAr(input),
      shortDescriptionEn: parsed.shortDescriptionEn || fallbackShortEn(input),
      shortDescriptionAr: parsed.shortDescriptionAr || fallbackShortAr(input),
      seoKeywordsEn: Array.isArray(parsed.seoKeywordsEn) ? parsed.seoKeywordsEn.slice(0, 8) : fallbackKeywordsEn(input),
      seoKeywordsAr: Array.isArray(parsed.seoKeywordsAr) ? parsed.seoKeywordsAr.slice(0, 8) : fallbackKeywordsAr(input),
      confidence: Math.min(Math.max(parsed.confidence ?? 0.7, 0), 1),
    };
  } catch {
    return {
      descriptionEn: fallbackEn(input),
      descriptionAr: fallbackAr(input),
      shortDescriptionEn: fallbackShortEn(input),
      shortDescriptionAr: fallbackShortAr(input),
      seoKeywordsEn: fallbackKeywordsEn(input),
      seoKeywordsAr: fallbackKeywordsAr(input),
      confidence: 0.3,
    };
  }
}

/**
 * Batch generate descriptions
 */
export async function generateDescriptionsBatch(inputs: DescriptionInput[]): Promise<DescriptionOutput[]> {
  const concurrency = 2; // Lower concurrency for longer prompts
  const results: DescriptionOutput[] = [];

  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(generateDescriptions));
    results.push(...batchResults);
  }

  return results;
}

// ============ FALLBACKS (deterministic, no LLM) ============

function fallbackEn(input: DescriptionInput): string {
  const parts = [
    input.productName,
    input.subcategory ? `(${input.subcategory})` : "",
    input.specs || "",
    categoryTaglineEn(input.category),
  ].filter(Boolean);

  return parts.join(". ").slice(0, 300);
}

function fallbackAr(input: DescriptionInput): string {
  const parts = [
    input.productName,
    input.subcategory ? `(${input.subcategory})` : "",
    input.specs || "",
    categoryTaglineAr(input.category),
  ].filter(Boolean);

  return parts.join("، ").slice(0, 300);
}

function fallbackShortEn(input: DescriptionInput): string {
  return `${input.productName}${input.specs ? ` — ${input.specs}` : ""}`.slice(0, 100);
}

function fallbackShortAr(input: DescriptionInput): string {
  return `${input.productName}${input.specs ? ` — ${input.specs}` : ""}`.slice(0, 100);
}

function fallbackKeywordsEn(input: DescriptionInput): string[] {
  const base = [input.productName.toLowerCase(), input.category.toLowerCase().replace("_", " ")];
  if (input.subcategory) base.push(input.subcategory.toLowerCase());
  if (input.brand) base.push(input.brand.toLowerCase());
  return [...new Set(base)].slice(0, 8);
}

function fallbackKeywordsAr(input: DescriptionInput): string[] {
  // Simple transliteration fallback - in production would use proper Arabic keywords
  return fallbackKeywordsEn(input).map(k => k.replace(/hotel/g, "فندق").replace(/commercial/g, "تجاري"));
}

function categoryTaglineEn(category: string): string {
  switch (category.toUpperCase()) {
    case "F_AND_B": return "Commercial-grade for hotel kitchens and restaurants.";
    case "CONSUMABLES": return "Durable, cost-effective supplies for daily hotel operations.";
    case "GUEST_SUPPLIES": return "Premium amenities enhancing guest experience at resorts and hotels.";
    case "FFE": return "Commercial-grade furniture and equipment built for hospitality durability.";
    case "SERVICES": return "Professional hospitality services with SLA-backed reliability.";
    default: return "Quality product for the hospitality industry.";
  }
}

function categoryTaglineAr(category: string): string {
  switch (category.toUpperCase()) {
    case "F_AND_B": return "جودة تجارية لمطابخ ومطاعم الفنادق.";
    case "CONSUMABLES": return "مستلزمات متينة وفعالة من حيث التكلفة للعمليات الفندقية اليومية.";
    case "GUEST_SUPPLIES": return "مستلزمات ضيافة متميزة تعزز تجربة النزلاء في المنتجعات والفنادق.";
    case "FFE": return "أثاث ومعدات بدرجة تجارية مصممة للمتانة في الضيافة.";
    case "SERVICES": return "خدمات ضيافة احترافية مع موثوقية مدعومة باتفاقيات مستوى الخدمة.";
    default: return "منتج عالي الجودة لصناعة الضيافة.";
  }
}