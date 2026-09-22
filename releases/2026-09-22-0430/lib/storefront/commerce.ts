/**
 * Smart Commerce Engine — storefront intelligence.
 *
 * 1. Smart search: tokenized query matching with term completion + related-term
 *    expansion (synonyms + category keywords) so "towls", "bed linen", "شامبو"
 *    resolve to the right products even with typos or partial words.
 * 2. Complementary products: what buyers typically bundle with an item.
 * 3. Alternatives / replacements: products that fulfill the same function.
 * 4. Cross-supplier price comparison (same SKU / normalized item across vendors).
 *
 * Pure functions — no I/O — so they're unit-testable and server/client safe.
 */

/* ── Normalization: strip diacritics, lowercase, collapse spaces ─────────── */
export function normalizeTerm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Common misspellings → canonical (Arabic + English). */
const CORRECTIONS: [string, string][] = [
  ["towls", "towels"], ["towles", "towels"], ["shampoo", "shampoo"], ["shampo", "shampoo"],
  ["schampoo", "shampoo"], ["linnen", "linen"], ["linnes", "linen"], ["sheats", "sheets"],
  ["shets", "sheets"], ["toweling", "towels"], ["minbar", "minibar"], ["glase", "glass"],
  ["plates", "plate"], ["pillos", "pillow"], ["mattas", "mattress"], ["materess", "mattress"],
  ["flight", "fixture"], ["contr", "control"],
];

export function correctTerm(token: string): string {
  const t = normalizeTerm(token);
  for (const [wrong, right] of CORRECTIONS) {
    if (t === wrong) return right;
  }
  return t;
}

/* ── Related-term expansion (synonyms + hospitality keywords per concept) ── */
const SYNONYMS: Record<string, string[]> = {
  towel: ["towel", "towels", "bath linen", "terry", "cotton towel"],
  sheet: ["sheet", "sheets", "bed linen", "fitted sheet", "flat sheet", "sleeping"],
  bedding: ["bedding", "duvet", "comforter", "blanket", "quilt"],
  soap: ["soap", "bar soap", "guest soap", "toilet soap"],
  shampoo: ["shampoo", "hair wash", "conditioner", "hair care"],
  amenity: ["amenity", "toiletry", "guest amenity", "bathroom set"],
  cleaning: ["clean", "cleaning", "detergent", "dish wash", "floor cleaner", "disinfectant"],
  glassware: ["glass", "glassware", "tumbler", "wine glass", "highball"],
  china: ["china", "chinaware", "plate", "bowl", "cup", "saucer", "dinnerware"],
  kitchen: ["kitchen", "cookware", "pot", "pan", "utensil", "chef"],
  uniform: ["uniform", "staff wear", "apron", "workwear", "chef coat"],
  refrigerator: ["refrigerator", "fridge", "cooler", "chiller", "mini bar fridge"],
  lighting: ["light", "lighting", "lamp", "bulb", "pendant", "chandelier"],
  pillow: ["pillow", "cushion", "bed pillow"],
  mattress: ["mattress", "bed mattress", "memory foam"],
  furniture: ["furniture", "sof a", "cabinet", "wardrobe", "table", "chair", "desk"],
  sanitizer: ["sanitizer", "hand sanitizer", "disinfectant", "gel"],
};

const conceptFor = (token: string): string | null => {
  const t = normalizeTerm(token);
  if (!t) return null;
  for (const [concept, words] of Object.entries(SYNONYMS)) {
    for (const w of words) {
      const nw = normalizeTerm(w);
      if (nw === t || nw.startsWith(t) || t.startsWith(nw)) return concept;
    }
  }
  return null;
};

/** Expand a query into a set of weighted search terms. */
export function expandQuery(query: string): string[] {
  const tokens = normalizeTerm(query).split(" ").filter(Boolean);
  const expanded = new Set<string>();
  for (const raw of tokens) {
    const t = correctTerm(raw);
    expanded.add(t);
    const concept = conceptFor(t);
    if (concept) for (const w of SYNONYMS[concept]) expanded.add(w);
  }
  return [...expanded];
}

/** Score a product against a query (0 = no match). Considers name, keywords, category. */
export function scoreProduct(query: string, product: { name: string; description?: string; category?: string; keywords?: string[] }): number {
  const terms = expandQuery(query);
  if (terms.length === 0) return 0;
  const haystack = normalizeTerm(
    [product.name, product.description || "", product.category || "", (product.keywords || []).join(" ")].join(" ")
  );
  let score = 0;
  for (const t of terms) {
    if (haystack.includes(t)) score += t.length > 3 ? 2 : 1;
    // prefix match on name tokens (partial-word completion)
    if (haystack.split(" ").some((w) => w.startsWith(t) && t.length >= 3)) score += 1;
  }
  return score;
}

/** Suggest completions for a partial query from a catalog index (unique name terms). */
export function suggestCompletions(partial: string, index: string[], limit = 8): string[] {
  const p = normalizeTerm(partial);
  if (p.length < 2) return [];
  const hits = new Set<string>();
  for (const item of index) {
    for (const word of normalizeTerm(item).split(" ")) {
      if (word.startsWith(p) && word.length > 2) hits.add(word);
      if (p.length >= 3 && word.includes(p) && word.length >= p.length) hits.add(word);
    }
    if (hits.size >= limit) break;
  }
  return [...hits].slice(0, limit);
}

/* ── Complementary products (bundles) ─────────────────────────────────────── */
const COMPLEMENTS: Record<string, string[]> = {
  towel: ["bath towel", "hand towel", "washcloth", "bath mat", "linen"],
  shampoo: ["conditioner", "bath gel", "soap", "shower cap", "amenity set"],
  soap: ["shampoo", "shower gel", "toothbrush", "toothpaste", "amenity tray"],
  sheet: ["pillowcase", "duvet", "blanket", "pillow", "bed skirt"],
  mattress: ["mattress protector", "fitted sheet", "pillow", "duvet", "headboard"],
  glass: ["wine glass", "highball", "tumbler", "shot glass", "china set"],
  plate: ["bowl", "cup", "saucer", "dinnerware set", "charger plate"],
  uniform: ["apron", "chef coat", "name badge", "work shoes", "cap"],
  cleaning: ["mop", "bucket", "spray bottle", "gloves", "trash bin"],
  iron: ["ironing board", "steam iron", "lint roller", "ironing pad"],
  coffee: ["coffee machine", "coffee beans", "coffee cup", "sugar", "creamer"],
  minibar: ["mini bar fridge", "glass", "snacks", "beverage", "bottle opener"],
};

export function complementaryKeywords(categoryKeywords: string[], name: string): string[] {
  const found = new Set<string>();
  for (const kw of [...categoryKeywords, name]) {
    for (const [concept, items] of Object.entries(COMPLEMENTS)) {
      if (kw.toLowerCase().includes(concept)) items.forEach((i) => found.add(i));
    }
  }
  return [...found];
}

/* ── Alternatives / replacements (same functional role) ───────────────────── */
const ALTERNATIVES: Record<string, string[]> = {
  shampoo: ["shampoo", "body wash", "2-in-1 gel", "soap bar"],
  towel: ["towel", "bath sheet", "baize", "microfiber towel"],
  sheet: ["sheet", "fitted sheet", "duvet cover", "flat sheet"],
  mattress: ["mattress", "mattress topper", "memory foam layer"],
  soap: ["soap", "liquid soap dispenser", "shower gel"],
  light: ["light bulb", "lamp", "ceiling light", "pendant"],
};

export function alternativeKeywords(name: string): string[] {
  const n = normalizeTerm(name);
  for (const [concept, alts] of Object.entries(ALTERNATIVES)) {
    if (n.includes(concept)) return alts;
  }
  return [];
}

/* ── Cross-supplier price comparison ─────────────────────────────────────── */
export interface PriceOffer {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  unitOfMeasure: string;
  minOrderQuantity?: number;
  rating?: number;
  city?: string;
  inStock?: boolean;
}

/** Group offers for the same logical item across suppliers; rank by price. */
export function comparePrices(offers: PriceOffer[]): { offers: PriceOffer[]; lowest: PriceOffer | null; spreadPct: number } {
  if (!offers || offers.length === 0) return { offers: [], lowest: null, spreadPct: 0 };
  const sorted = [...offers].sort((a, b) => a.unitPrice - b.unitPrice);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const spreadPct = lowest.unitPrice > 0 ? ((highest.unitPrice - lowest.unitPrice) / lowest.unitPrice) * 100 : 0;
  return { offers: sorted, lowest, spreadPct: Math.round(spreadPct * 10) / 10 };
}
