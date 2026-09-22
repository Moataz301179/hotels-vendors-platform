/**
 * Supplier Catalog Discovery Engine
 *
 * Probes REAL Egyptian supplier domains (curated from the P0 registry + verified
 * sources) for ANY publicly-ingestible product catalog endpoint (WordPress REST,
 * WooCommerce REST, Shopify JSON, structured sitemap). Real findings only —
 * NO-FAKE-DATA: an endpoint only qualifies if it returns a parseable product
 * array/list from the live site.
 */
export interface DiscoveredCatalog {
  name: string;
  domain: string;
  kind: "wp-rest" | "wc-rest" | "shopify" | "sitemap" | "none";
  productUrl?: string;
  sampleCount: number;   // real products detected on the endpoint
  sampleTitle?: string;  // first real product title (proves liveness)
  status: "LIVE" | "BLOCKED" | "NONE";
  note?: string;
}

const UPSTREAM =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Candidate endpoints to probe per domain (in order of value). */
const ENDPOINTS = [
  { kind: "wp-rest", url: (d: string) => `https://${d}/wp-json/wp/v2/product` },
  { kind: "wp-rest", url: (d: string) => `https://${d}/wp-json/wp/v2/products` },
  { kind: "wc-rest", url: (d: string) => `https://${d}/wp-json/wc/v3/products` },
  { kind: "shopify", url: (d: string) => `https://${d}/products.json` },
] as const;

async function probe(url: string): Promise<{ status: number; body: string; blocked: boolean }> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UPSTREAM, accept: "application/json,text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.text();
    const blocked =
      res.status === 403 || /just a moment|cf-browser|__cf|access denied/i.test(body.slice(0, 400));
    return { status: res.status, body, blocked };
  } catch {
    return { status: 0, body: "", blocked: false };
  }
}

/** Does the body look like a JSON product array (not HTML / error)? */
function parseProducts(body: string): { count: number; title?: string } {
  const t = body.trim();
  if (!t.startsWith("[") && !t.startsWith("{")) return { count: 0 };
  try {
    const obj = JSON.parse(t) as Record<string, unknown>;
    const rawData: unknown =
      (obj.data as Record<string, unknown> | undefined)?.products ?? obj.products ?? (Array.isArray(obj) ? obj : null);
    const arr: unknown[] = [];
    if (Array.isArray(rawData)) arr.push(...rawData);
    else if (Array.isArray(obj.data)) arr.push(...(obj.data as unknown[]));
    if (!arr.length) return { count: 0 };
    const first = arr[0] as Record<string, unknown>;
    const r = (first.title as Record<string, unknown> | undefined)?.rendered;
    const title = String(r ?? first.name ?? first.title ?? "").replace(/<[^>]+>/g, "").trim();
    return { count: arr.length, title: title || undefined };
  } catch {
    return { count: 0 };
  }
}

/** Discover whether a real domain exposes an ingestible catalog. */
export async function discoverSupplierCatalog(input: {
  name: string;
  domain: string;
}): Promise<DiscoveredCatalog> {
  for (const ep of ENDPOINTS) {
    const url = ep.url(input.domain);
    const r = await probe(url);
    if (r.blocked) {
      return { name: input.name, domain: input.domain, kind: "none", status: "BLOCKED", sampleCount: 0, note: `${ep.kind} on ${url} blocked (403/CF)` };
    }
    if (r.status === 200) {
      const { count, title } = parseProducts(r.body);
      if (count > 0) {
        return {
          name: input.name, domain: input.domain, kind: ep.kind,
          productUrl: url, sampleCount: count, sampleTitle: title, status: "LIVE",
        };
      }
    }
  }
  return { name: input.name, domain: input.domain, kind: "none", status: "NONE", sampleCount: 0, note: "no public product endpoint detected" };
}

/** Probe a batch of real supplier domains, concurrent. */
export async function discoverMany(inputs: { name: string; domain: string }[]): Promise<DiscoveredCatalog[]> {
  const results: DiscoveredCatalog[] = [];
  const queue = [...inputs];
  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item) results.push(await discoverSupplierCatalog(item));
    }
  });
  await Promise.all(workers);
  return results.sort((a, b) => (a.status === b.status ? 0 : a.status === "LIVE" ? -1 : 1));
}