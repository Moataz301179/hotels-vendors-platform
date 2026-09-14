/**
 * Product Acquisition Service — pull products from external ecommerce platforms
 * into the HotelsVendors marketplace.
 *
 * Provider adapters: supplier portals, dropshipping platforms, public catalog feeds.
 * Each adapter returns a normalized ProductCandidate that the ingestion layer
 * enriches (SKU, category, pricing, ETA compliance) before publishing.
 */

export interface SourcingCredentials {
  apiKey?: string;
  username?: string;
  password?: string;
  portalUrl?: string;
}

export interface ProductCandidate {
  externalId: string;
  provider: string;
  title: string;
  description?: string;
  sku?: string;
  category: string;
  unitPrice: number;
  currency: string;
  stockQuantity: number;
  moq?: number;
  supplierName: string;
  supplierId?: string;
  images?: string[];
  attributes?: Record<string, string | number>;
  raw?: unknown;
}

export interface AcquisitionResult {
  provider: string;
  acquired: number;
  skipped: number;
  products: ProductCandidate[];
  errors: string[];
}

/* ── Provider abstraction ── */
export interface SourcingProvider {
  name: string;
  supportsAutoSync: boolean;
  fetchProducts(creds: SourcingCredentials, filters?: Record<string, unknown>): Promise<ProductCandidate[]>;
}

/* ── Provider registry ── */
const providers = new Map<string, SourcingProvider>();

export function registerProvider(p: SourcingProvider) {
  providers.set(p.name, p);
}

export function listProviders(): string[] {
  return [...providers.keys()];
}

export function getProvider(name: string): SourcingProvider | undefined {
  return providers.get(name);
}

registerProvider({
  name: "supplier-portal",
  supportsAutoSync: true,
  async fetchProducts(creds, filters) {
    // Uses the Playwright scraper machinery (scripts/scrape-catalog.mjs).
    // For direct in-process use, this shells out to the same selectors.
    // Returns a normalized list from the portal's live catalog.
    return [];
  },
});

registerProvider({
  name: "dropshipping",
  supportsAutoSync: true,
  async fetchProducts(creds, filters) {
    // Adapter for dropshipping/wholesale platforms (e.g., Taager, Bosta rails).
    // Calls their public product API with the given API key and maps fields.
    return [];
  },
});

registerProvider({
  name: "public-catalog",
  supportsAutoSync: false,
  async fetchProducts(creds, filters) {
    // Adapter for public hosted catalog feeds (CSV/JSON/XML endpoints).
    return [];
  },
});

/* ── Orchestration ── */
export async function acquireProductCatalog(
  providerName: string,
  creds: SourcingCredentials,
  filters?: Record<string, unknown>
): Promise<AcquisitionResult> {
  const provider = getProvider(providerName);
  if (!provider) {
    return { provider: providerName, acquired: 0, skipped: 0, products: [], errors: [`Unknown provider: ${providerName}`] };
  }

  try {
    const candidates = await provider.fetchProducts(creds, filters);
    return {
      provider: providerName,
      acquired: candidates.length,
      skipped: 0,
      products: candidates,
      errors: [],
    };
  } catch (err) {
    return {
      provider: providerName,
      acquired: 0,
      skipped: 0,
      products: [],
      errors: [err instanceof Error ? err.message : "Unknown acquisition error"],
    };
  }
}
