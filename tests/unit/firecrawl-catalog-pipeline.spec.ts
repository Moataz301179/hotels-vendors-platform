import { describe, expect, it, vi } from "vitest";
import type { CatalogSourceType } from "@prisma/client";
import {
  buildExtractionJobs,
  FirecrawlCatalogPipeline,
  runDiscoveredCatalog,
} from "@/lib/sourcing/firecrawl-catalog-pipeline";
import {
  createFirecrawlClient,
  readFirecrawlConfig,
  type FirecrawlAgentClient,
  type FirecrawlAgentRequest,
  type FirecrawlAgentStatusResponse,
  type FirecrawlConfig,
} from "@/lib/sourcing/firecrawl-client";

const marketplace = "MARKETPLACE" as CatalogSourceType;

function testConfig(): FirecrawlConfig {
  return {
    apiKey: "test-key",
    apiUrl: "https://firecrawl.test",
    model: "spark-1-mini",
    maxRetries: 1,
    retryBaseMs: 0,
    requestTimeoutMs: 1_000,
    pollIntervalMs: 0,
    maxWaitMs: 1_000,
  };
}

class FakeFirecrawl implements FirecrawlAgentClient {
  requests: FirecrawlAgentRequest[] = [];
  private sequence = 0;
  private data = new Map<string, unknown>();

  constructor(private readonly resultFor: (request: FirecrawlAgentRequest) => unknown) {}

  async startAgent(request: FirecrawlAgentRequest) {
    this.requests.push(request);
    const id = `job-${++this.sequence}`;
    this.data.set(id, this.resultFor(request));
    return { success: true, id };
  }

  async getAgentStatus(jobId: string): Promise<FirecrawlAgentStatusResponse> {
    return { success: true, status: "completed", data: this.data.get(jobId) };
  }
}

describe("Firecrawl catalog pipeline", () => {
  it("fans out by source/category and retains duplicate-source observations for comparison", async () => {
    const client = new FakeFirecrawl((request) => {
      const sourceUrl = request.urls[0];
      const isSecond = sourceUrl.includes("second");
      return {
        products: [
          {
            externalId: "butter-1",
            name: "Butter 1 kg",
            brand: "Hotel Brand",
            category: "Food and Beverage",
            unitOfMeasure: "kg",
            price: isSecond ? 120 : 100,
            currency: "EGP",
            imageUrl: isSecond ? undefined : "https://first.example/images/butter.jpg",
            sourceUrl: `${sourceUrl}/butter-1`,
            supplierName: "Supplier One",
            supplierUrl: "https://supplier.example",
          },
          // Same source observation: should be ignored by the evidence hash.
          {
            externalId: "butter-1",
            name: "Butter 1 kg",
            brand: "Hotel Brand",
            category: "Food and Beverage",
            unitOfMeasure: "kg",
            price: isSecond ? 120 : 100,
            currency: "EGP",
            sourceUrl: `${sourceUrl}/butter-1`,
            supplierName: "Supplier One",
            supplierUrl: "https://supplier.example",
          },
        ],
      };
    });
    const supplierMapper = vi.fn(async (candidate) => ({
      key: candidate.key,
      supplierId: "supplier-1",
      status: "MATCHED" as const,
    }));
    const sources = [
      {
        id: "first",
        name: "First public market",
        baseUrl: "https://first.example",
        urls: ["https://first.example/shop"],
        sourceType: marketplace,
        rateLimitMs: 0,
      },
      {
        id: "second",
        name: "Second public market",
        baseUrl: "https://second.example",
        urls: ["https://second.example/shop"],
        sourceType: marketplace,
        rateLimitMs: 0,
      },
    ];
    const report = await new FirecrawlCatalogPipeline({
      tenantId: "tenant-1",
      categories: ["Food and Beverage"],
      sources,
      client,
      config: testConfig(),
      supplierMapper,
      persist: false,
    }).run();

    expect(client.requests).toHaveLength(2);
    expect(client.requests.every((request) => request.strictConstrainToURLs === true)).toBe(true);
    expect(client.requests.every((request) => request.schema.properties)).toBe(true);
    expect(report.counts.jobs).toBe(2);
    expect(report.counts.products).toBe(1);
    expect(report.counts.observations).toBe(2);
    expect(report.products[0]?.pricing).toMatchObject({
      observedPrices: [100, 120],
      min: 100,
      max: 120,
      median: 110,
      state: "COMPARISON_READY",
      rfqRequired: false,
    });
    expect(report.products[0]?.imageRightsStatus).toBe("SOURCE_REVIEW_REQUIRED");
    expect(supplierMapper).toHaveBeenCalledTimes(1);
    expect(report.supplierMappings).toEqual([{ key: "supplier one|https supplier example", supplierId: "supplier-1", status: "MATCHED" }]);
    expect(report.counts.persistedObservations).toBe(0);
  });

  it("marks missing prices as RFQ-required and never invents an image", async () => {
    const client = new FakeFirecrawl(() => ({
      products: [{
        name: "Commercial laundry detergent",
        category: "Housekeeping",
        description: "Public description",
        sourceUrl: "https://supplier.example/detergent",
        currency: "EGP",
      }],
    }));
    const report = await new FirecrawlCatalogPipeline({
      tenantId: "tenant-1",
      categories: ["Housekeeping"],
      sources: [{
        id: "supplier",
        name: "Supplier public site",
        baseUrl: "https://supplier.example",
        sourceType: "SUPPLIER_SITE" as CatalogSourceType,
        rateLimitMs: 0,
      }],
      client,
      config: testConfig(),
    }).run();

    const product = report.products[0];
    expect(product?.pricing.state).toBe("RFQ_REQUIRED");
    expect(product?.pricing.rfqRequired).toBe(true);
    expect(report.counts.rfqRequiredObservations).toBe(1);
    expect(product?.imageUrl).toBeUndefined();
    expect(report.observations[0]?.price).toBeUndefined();
    expect(report.observations[0]?.imageRightsStatus).toBeUndefined();
  });

  it("accepts an Agent Reach discovery adapter without putting discovery credentials in Firecrawl", async () => {
    const client = new FakeFirecrawl(() => ({ products: [{ name: "Hotel tray", sourceUrl: "https://source.example/tray" }] }));
    const report = await runDiscoveredCatalog({
      tenantId: "tenant-1",
      categories: ["Buffet items"],
      discovery: {
        async discover() {
          return [{
            id: "source",
            name: "Agent Reach approved source",
            baseUrl: "https://source.example",
            urls: ["https://source.example/buffet"],
            sourceType: marketplace,
            rateLimitMs: 0,
          }];
        },
      },
      client,
      config: testConfig(),
    });

    expect(report.counts.jobs).toBe(1);
    expect(client.requests[0]?.urls).toEqual(["https://source.example/buffet"]);
  });

  it("rejects private or local source URLs before an extraction job is submitted", () => {
    expect(() => buildExtractionJobs([{
      id: "private",
      name: "Private source",
      baseUrl: "http://127.0.0.1:3000",
      sourceType: marketplace,
    }], ["Food and Beverage"])).toThrow(/public host/);
  });

  it("reads Firecrawl configuration without treating a missing key as ready", () => {
    const config = readFirecrawlConfig({ FIRECRAWL_API_URL: "https://api.firecrawl.dev" });
    expect(config.apiKey).toBeUndefined();
    expect(config.apiUrl).toBe("https://api.firecrawl.dev");
  });

  it("retries transient Firecrawl API failures", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "busy" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, id: "job-1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const client = createFirecrawlClient({ ...testConfig(), retryBaseMs: 0 });
      const result = await client.startAgent({ prompt: "extract", urls: ["https://source.example"], schema: {} });
      expect(result).toMatchObject({ success: true, id: "job-1" });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
