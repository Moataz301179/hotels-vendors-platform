export type WordpressPublicProduct = {
  id: number;
  link: string;
  name: string;
  categories: string[];
  imageUrl: string | null;
};

type WordpressPayload = {
  id?: number;
  link?: string;
  title?: { rendered?: string };
  product_category?: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
    "wp:term"?: Array<Array<{ name?: string; taxonomy?: string }>>;
  };
};

function categoriesOf(item: WordpressPayload): string[] {
  const groups = item._embedded?.["wp:term"] ?? [];
  return groups.flatMap((group) => group.flatMap((term) => {
    if (term.taxonomy && term.taxonomy !== "product_category" && term.taxonomy !== "brands") return [];
    return term.name ? [term.name] : [];
  }));
}

export function parseWordpressProducts(payload: unknown): WordpressPublicProduct[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as WordpressPayload;
    const name = row.title?.rendered?.trim();
    if (!row.id || !row.link || !name) return [];
    const image = row._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;
    return [{ id: row.id, link: row.link, name, categories: categoriesOf(row), imageUrl: image }];
  });
}

/** Read a public WordPress product collection. Stops at the first empty page. */
export async function fetchWordpressProducts(
  endpoint: string,
  options: { fetchImpl?: typeof fetch; maxRecords?: number } = {},
): Promise<WordpressPublicProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRecords = options.maxRecords ?? 200;
  const products: WordpressPublicProduct[] = [];
  for (let page = 1; products.length < maxRecords && page <= 20; page += 1) {
    const url = new URL(endpoint);
    url.searchParams.set("per_page", "50");
    url.searchParams.set("page", String(page));
    url.searchParams.set("_embed", "1");
    const response = await fetchImpl(url.toString(), {
      headers: { accept: "application/json", "user-agent": "HotelsVendors-CatalogBot/1.0 (+https://hotelsvendors.com)" },
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) break;
    const parsed = parseWordpressProducts(await response.json());
    if (!parsed.length) break;
    products.push(...parsed);
  }
  return products.slice(0, maxRecords);
}
