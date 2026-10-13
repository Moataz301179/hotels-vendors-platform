/**
 * Firecrawl-backed public catalog pipeline.
 *
 * Responsibilities:
 *   1. Accept approved public URLs (normally produced by Agent Reach).
 *   2. Fan extraction jobs out by source and hospitality category.
 *   3. Normalize real observations without inventing names, prices or images.
 *   4. Deduplicate product identities while retaining every source observation.
 *   5. Expose supplier-mapping hooks without exposing suppliers to hotels.
 *   6. Optionally persist observations through the tenant-scoped registry.
 *
 * This service does not send outreach, publish listings, or create supplier
 * records. Those are separate workflows and must consume this report only
 * after review/consent rules are applied.
 */

import { createHash } from "node:crypto";
import type { CatalogSourceType, EvidenceClass } from "@prisma/client";
import {
  assertFirecrawlCredentials,
  createFirecrawlClient,
  FirecrawlConfigurationError,
  readFirecrawlConfig,
  runFirecrawlAgent,
  type FirecrawlAgentClient,
  type FirecrawlAgentRequest,
  type FirecrawlConfig,
} from "@/lib/sourcing/firecrawl-client";
import {
  recordCatalogObservation,
  type CatalogObservation,
} from "@/lib/sourcing/catalog-registry";

export const FIRECRAWL_PRODUCT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          externalId: { type: "string" },
          name: { type: "string" },
          brand: { type: "string" },
          category: { type: "string" },
          subcategory: { type: "string" },
          unitOfMeasure: { type: "string" },
          packSize: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          currency: { type: "string" },
          availability: { type: "string" },
          stockQuantity: { type: "number" },
          imageUrl: { type: "string" },
          sourceUrl: { type: "string" },
          supplierName: { type: "string" },
          supplierUrl: { type: "string" },
        },
        required: ["name"],
      },
    },
  },
  required: ["products"],
};

export interface ApprovedCatalogSource {
  id: string;
  name: string;
  baseUrl: string;
  sourceType: CatalogSourceType;
  urls?: string[];
  categories?: string[];
  rateLimitMs?: number;
  supplierName?: string;
  supplierUrl?: string;
}

export interface CatalogExtractionJob {
  id: string;
  source: ApprovedCatalogSource;
  category: string;
  urls: string[];
}

export interface RawFirecrawlProduct {
  externalId?: unknown;
  id?: unknown;
  sku?: unknown;
  name?: unknown;
  title?: unknown;
  brand?: unknown;
  category?: unknown;
  subcategory?: unknown;
  unitOfMeasure?: unknown;
  unit?: unknown;
  packSize?: unknown;
  description?: unknown;
  price?: unknown;
  currency?: unknown;
  availability?: unknown;
  stockQuantity?: unknown;
  imageUrl?: unknown;
  imageURL?: unknown;
  sourceUrl?: unknown;
  url?: unknown;
  supplierName?: unknown;
  supplierUrl?: unknown;
  supplier?: unknown;
  [key: string]: unknown;
}

export type PriceState = "RFQ_REQUIRED" | "SINGLE_OBSERVATION" | "COMPARISON_READY";

export interface SupplierMappingCandidate {
  key: string;
  name: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  supplierUrl?: string;
  evidenceUrl: string;
}

export interface SupplierMappingResult {
  key: string;
  supplierId?: string;
  status: "MATCHED" | "UNMATCHED" | "REVIEW_REQUIRED";
  note?: string;
}

export interface CatalogObservationEnvelope {
  observationKey: string;
  productIdentityKey: string;
  tenantId: string;
  sourceId: string;
  sourceName: string;
  sourceType: CatalogSourceType;
  sourceBaseUrl: string;
  sourceUrl: string;
  externalKey?: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  unitOfMeasure?: string;
  packSize?: string;
  description?: string;
  price?: number;
  currency?: string;
  priceState: "OBSERVED" | "RFQ_REQUIRED";
  imageUrl?: string;
  imageRightsStatus?: "SOURCE_REVIEW_REQUIRED" | "LICENSED" | "UNKNOWN";
  availability?: string;
  stockQuantity?: number;
  supplier?: SupplierMappingCandidate;
  provenance: EvidenceClass;
  observedAt: string;
}

export interface CatalogProductAggregate {
  productIdentityKey: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  unitOfMeasure?: string;
  packSize?: string;
  description?: string;
  imageUrl?: string;
  imageRightsStatus?: CatalogObservationEnvelope["imageRightsStatus"];
  observations: CatalogObservationEnvelope[];
  pricing: {
    currency?: string;
    observedPrices: number[];
    min?: number;
    max?: number;
    median?: number;
    state: PriceState;
    rfqRequired: boolean;
  };
}

export type CatalogJobState = "COMPLETED" | "EMPTY" | "FAILED" | "CONFIGURATION_REQUIRED";

export interface CatalogJobReport {
  job: CatalogExtractionJob;
  state: CatalogJobState;
  firecrawlJobId?: string;
  extractedCount: number;
  acceptedCount: number;
  skippedCount: number;
  persistedCount: number;
  errors: string[];
}

export interface FirecrawlCatalogRunReport {
  runId: string;
  startedAt: string;
  completedAt: string;
  jobs: CatalogJobReport[];
  products: CatalogProductAggregate[];
  observations: CatalogObservationEnvelope[];
  supplierMappings: SupplierMappingResult[];
  errors: string[];
  counts: {
    jobs: number;
    completedJobs: number;
    failedJobs: number;
    products: number;
    observations: number;
    pricedObservations: number;
    rfqRequiredObservations: number;
    persistedObservations: number;
  };
}

export interface FirecrawlCatalogPipelineOptions {
  tenantId: string;
  categories: string[];
  sources: ApprovedCatalogSource[];
  maxConcurrency?: number;
  persist?: boolean;
  config?: FirecrawlConfig;
  client?: FirecrawlAgentClient;
  supplierMapper?: (candidate: SupplierMappingCandidate) => Promise<SupplierMappingResult | undefined>;
  now?: () => Date;
}

export interface AgentReachSourceDiscovery {
  discover(input: { categories: string[] }): Promise<ApprovedCatalogSource[]>;
}

export function assertPublicUrl(value: string, label = "URL"): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid http(s) URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label} must use http or https`);
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "::1" ||
    host === "0.0.0.0" ||
    /^(10|127)\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    throw new Error(`${label} must point to a public host`);
  }
  return parsed.toString();
}

function clean(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text || undefined;
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

/** Parse a displayed price only; never converts currencies or supplies a default. */
export function parseObservedPrice(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : undefined;
  const text = clean(value);
  if (!text) return undefined;
  const normalized = normalizeDigits(text).replace(/[^0-9.,-]/g, "");
  if (!normalized || /^-/.test(normalized)) return undefined;
  const commaCount = (normalized.match(/,/g) || []).length;
  const dotCount = (normalized.match(/\./g) || []).length;
  let numberText = normalized;
  if (dotCount > 0 && commaCount > 0) numberText = normalized.replace(/,/g, "");
  else if (commaCount > 0) {
    const lastComma = normalized.lastIndexOf(",");
    const fractionalDigits = normalized.length - lastComma - 1;
    numberText = fractionalDigits === 1 || fractionalDigits === 2
      ? `${normalized.slice(0, lastComma).replace(/,/g, "")}.${normalized.slice(lastComma + 1)}`
      : normalized.replace(/,/g, "");
  }
  const parsed = Number.parseFloat(numberText);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : undefined;
}

function normalizedIdentityPart(value: unknown): string {
  const text = value === undefined || value === null ? "" : String(value);
  return text
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function productIdentityKey(input: Pick<CatalogObservationEnvelope, "name" | "brand" | "category" | "unitOfMeasure" | "packSize">): string {
  return [input.category, input.brand, input.name, input.unitOfMeasure, input.packSize]
    .map(normalizedIdentityPart)
    .filter(Boolean)
    .join("|");
}

export function observationHash(input: Pick<CatalogObservationEnvelope, "sourceUrl" | "externalKey" | "name" | "brand" | "price" | "currency" | "imageUrl">): string {
  return createHash("sha256")
    .update(JSON.stringify({
      sourceUrl: input.sourceUrl,
      externalKey: input.externalKey || null,
      name: input.name,
      brand: input.brand || null,
      price: input.price ?? null,
      currency: input.currency || null,
      imageUrl: input.imageUrl || null,
    }))
    .digest("hex");
}

function validOptionalUrl(value: unknown): string | undefined {
  const text = clean(value);
  if (!text) return undefined;
  try {
    return assertPublicUrl(text, "Source URL");
  } catch {
    return undefined;
  }
}

function parseStock(value: unknown): number | undefined {
  const text = clean(value);
  if (!text) return undefined;
  const parsed = Number.parseInt(normalizeDigits(text).replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function unwrapProducts(data: unknown): RawFirecrawlProduct[] {
  if (Array.isArray(data)) return data.filter((item): item is RawFirecrawlProduct => !!item && typeof item === "object");
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of ["products", "items", "results", "data"]) {
    const value = record[key];
    if (Array.isArray(value)) return value.filter((item): item is RawFirecrawlProduct => !!item && typeof item === "object");
    if (value && typeof value === "object") {
      const nested = unwrapProducts(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function nestedSupplierValue(raw: RawFirecrawlProduct, key: "name" | "url"): unknown {
  if (!raw.supplier || typeof raw.supplier !== "object") return undefined;
  const supplier = raw.supplier as Record<string, unknown>;
  return supplier[key] ?? supplier[key === "name" ? "supplierName" : "website"];
}

export function buildExtractionPrompt(job: Pick<CatalogExtractionJob, "source" | "category" | "urls">): string {
  return [
    "Extract public hospitality supply products from the approved URLs only.",
    `Source: ${job.source.name}. Requested category: ${job.category}.`,
    "Return one row per real product listing and do not return services, articles, or navigation links.",
    "Copy names, brands, descriptions, pack sizes, availability and prices exactly as displayed.",
    "If a price is not visibly published, omit price and currency; do not estimate, infer or convert it.",
    "If an image is publicly linked, return its direct image URL; do not generate or substitute an image.",
    "Return the exact product detail page URL in sourceUrl whenever available.",
    "Return supplierName/supplierUrl only when the page explicitly identifies them.",
    `Approved URLs: ${job.urls.join(", ")}`,
  ].join(" ");
}

export function buildExtractionJobs(
  sources: ApprovedCatalogSource[],
  categories: string[],
): CatalogExtractionJob[] {
  const cleanCategories = [...new Set(categories.map((category) => category.trim()).filter(Boolean))];
  if (!cleanCategories.length) throw new Error("At least one catalog category is required");
  const jobs: CatalogExtractionJob[] = [];
  for (const source of sources) {
    if (!source.id.trim() || !source.name.trim()) throw new Error("Each catalog source requires an id and name");
    const baseUrl = assertPublicUrl(source.baseUrl, `Source ${source.id} baseUrl`);
    const urls = (source.urls?.length ? source.urls : [baseUrl]).map((url, index) => assertPublicUrl(url, `Source ${source.id} URL ${index + 1}`));
    const selectedCategories = source.categories?.length
      ? cleanCategories.filter((category) => source.categories?.some((item) => item.toLowerCase() === category.toLowerCase()))
      : cleanCategories;
    for (const category of selectedCategories) {
      jobs.push({
        id: `firecrawl:${source.id}:${normalizedIdentityPart(category).replace(/ /g, "-")}`,
        source: { ...source, baseUrl, urls },
        category,
        urls,
      });
    }
  }
  return jobs;
}

function normalizeCurrency(value: unknown): string | undefined {
  const currency = clean(value)?.toUpperCase();
  if (!currency) return undefined;
  if (["ج.م", "جنيه", "جنيه مصري", "LE", "L.E"].includes(currency)) return "EGP";
  return currency;
}

function normalizeRawProduct(
  raw: RawFirecrawlProduct,
  job: CatalogExtractionJob,
  tenantId: string,
  now: Date,
): CatalogObservationEnvelope | undefined {
  const name = clean(raw.name) || clean(raw.title);
  if (!name) return undefined;
  const sourceUrl = validOptionalUrl(raw.sourceUrl) || validOptionalUrl(raw.url) || job.urls[0];
  if (!sourceUrl) return undefined;
  const brand = clean(raw.brand);
  const category = clean(raw.category) || job.category;
  const subcategory = clean(raw.subcategory);
  const unitOfMeasure = clean(raw.unitOfMeasure) || clean(raw.unit);
  const packSize = clean(raw.packSize);
  const price = parseObservedPrice(raw.price);
  const currency = normalizeCurrency(raw.currency);
  const imageUrl = validOptionalUrl(raw.imageUrl) || validOptionalUrl(raw.imageURL);
  const supplierName = clean(raw.supplierName) || clean(nestedSupplierValue(raw, "name")) || clean(job.source.supplierName);
  const supplierUrl = validOptionalUrl(raw.supplierUrl) || validOptionalUrl(nestedSupplierValue(raw, "url")) || validOptionalUrl(job.source.supplierUrl);
  const externalKey = clean(raw.externalId) || clean(raw.id) || clean(raw.sku);
  const candidateWithoutKey = {
    tenantId,
    sourceId: job.source.id,
    sourceName: job.source.name,
    sourceType: job.source.sourceType,
    sourceBaseUrl: job.source.baseUrl,
    sourceUrl,
    externalKey,
    name,
    brand,
    category,
    subcategory,
    unitOfMeasure,
    packSize,
    description: clean(raw.description),
    price,
    currency,
    priceState: price === undefined ? "RFQ_REQUIRED" as const : "OBSERVED" as const,
    imageUrl,
    imageRightsStatus: imageUrl ? "SOURCE_REVIEW_REQUIRED" as const : undefined,
    availability: clean(raw.availability),
    stockQuantity: parseStock(raw.stockQuantity),
    provenance: "OBSERVED" as EvidenceClass,
    observedAt: now.toISOString(),
  } satisfies Omit<CatalogObservationEnvelope, "observationKey" | "productIdentityKey" | "supplier">;
  const supplier = supplierName
    ? {
        key: [normalizedIdentityPart(supplierName), normalizedIdentityPart(supplierUrl)].filter(Boolean).join("|"),
        name: supplierName,
        sourceId: job.source.id,
        sourceName: job.source.name,
        sourceUrl: job.source.baseUrl,
        supplierUrl,
        evidenceUrl: sourceUrl,
      }
    : undefined;
  return {
    ...candidateWithoutKey,
    observationKey: observationHash(candidateWithoutKey),
    productIdentityKey: productIdentityKey(candidateWithoutKey),
    supplier,
  };
}

function median(numbers: number[]): number | undefined {
  if (!numbers.length) return undefined;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 100) / 100;
}

function aggregateProducts(observations: CatalogObservationEnvelope[]): CatalogProductAggregate[] {
  const groups = new Map<string, CatalogProductAggregate>();
  for (const observation of observations) {
    const existing = groups.get(observation.productIdentityKey);
    if (existing) {
      existing.observations.push(observation);
      if (!existing.imageUrl && observation.imageUrl) {
        existing.imageUrl = observation.imageUrl;
        existing.imageRightsStatus = observation.imageRightsStatus;
      }
      continue;
    }
    groups.set(observation.productIdentityKey, {
      productIdentityKey: observation.productIdentityKey,
      name: observation.name,
      brand: observation.brand,
      category: observation.category,
      subcategory: observation.subcategory,
      unitOfMeasure: observation.unitOfMeasure,
      packSize: observation.packSize,
      description: observation.description,
      imageUrl: observation.imageUrl,
      imageRightsStatus: observation.imageRightsStatus,
      observations: [observation],
      pricing: { observedPrices: [], state: "RFQ_REQUIRED", rfqRequired: true },
    });
  }
  return [...groups.values()].map((product) => {
    const prices = product.observations
      .filter((observation) => observation.price !== undefined)
      .map((observation) => observation.price as number);
    const currency = product.observations.find((observation) => observation.currency)?.currency;
    product.pricing = {
      currency,
      observedPrices: prices,
      min: prices.length ? Math.min(...prices) : undefined,
      max: prices.length ? Math.max(...prices) : undefined,
      median: median(prices),
      state: prices.length >= 2 ? "COMPARISON_READY" : prices.length === 1 ? "SINGLE_OBSERVATION" : "RFQ_REQUIRED",
      rfqRequired: prices.length === 0,
    };
    return product;
  });
}

function unwrapSourceType(sourceType: CatalogSourceType): CatalogSourceType {
  return sourceType;
}

function extractionDuplicateKey(observation: CatalogObservationEnvelope): string {
  // Firecrawl can repeat a card when a page exposes the same listing in more
  // than one component. Keep distinct source observations, but collapse those
  // same-page repeats even when one repeated card omitted its image URL.
  return [
    observation.sourceId,
    observation.sourceUrl,
    observation.externalKey || observation.name,
    observation.price ?? "rfq",
    observation.currency || "",
  ].map(normalizedIdentityPart).join("|");
}

function toRegistryObservation(observation: CatalogObservationEnvelope): CatalogObservation {
  return {
    tenantId: observation.tenantId,
    source: {
      name: observation.sourceName,
      type: unwrapSourceType(observation.sourceType),
      baseUrl: observation.sourceBaseUrl,
    },
    sourceUrl: observation.sourceUrl,
    externalKey: observation.externalKey,
    name: observation.name,
    brand: observation.brand,
    category: observation.category,
    subcategory: observation.subcategory,
    unitOfMeasure: observation.unitOfMeasure,
    description: observation.description,
    price: observation.price,
    currency: observation.currency,
    imageUrl: observation.imageUrl,
    imageRightsStatus: observation.imageRightsStatus,
    provenance: observation.provenance,
    confidence: observation.priceState === "OBSERVED" ? 80 : 60,
  };
}

class SourceRateLimiter {
  private nextAllowed = new Map<string, number>();

  async wait(sourceId: string, delayMs: number): Promise<void> {
    const now = Date.now();
    const waitMs = Math.max(0, (this.nextAllowed.get(sourceId) || now) - now);
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    this.nextAllowed.set(sourceId, Date.now() + Math.max(0, delayMs));
  }
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function unwrapFirecrawlRequest(job: CatalogExtractionJob): FirecrawlAgentRequest {
  return {
    prompt: buildExtractionPrompt(job),
    urls: job.urls,
    schema: FIRECRAWL_PRODUCT_SCHEMA,
    strictConstrainToURLs: true,
    integration: "hotelsvendors-catalog",
  };
}

export class FirecrawlCatalogPipeline {
  private readonly config: FirecrawlConfig;
  private readonly client: FirecrawlAgentClient;
  private readonly now: () => Date;
  private readonly rateLimiter = new SourceRateLimiter();

  constructor(private readonly options: FirecrawlCatalogPipelineOptions) {
    this.config = options.config ?? readFirecrawlConfig();
    this.client = options.client ?? createFirecrawlClient(this.config);
    this.now = options.now ?? (() => new Date());
  }

  buildJobs(): CatalogExtractionJob[] {
    return buildExtractionJobs(this.options.sources, this.options.categories);
  }

  async run(): Promise<FirecrawlCatalogRunReport> {
    if (!this.options.tenantId.trim()) throw new Error("Catalog pipeline requires a tenantId");
    const jobs = this.buildJobs();
    const runStarted = this.now();
    const allObservations: CatalogObservationEnvelope[] = [];
    const supplierMappings = new Map<string, SupplierMappingResult>();
    const supplierCandidates = new Map<string, SupplierMappingCandidate>();
    const errors: string[] = [];
    let persistedObservations = 0;

    let configError: FirecrawlConfigurationError | undefined;
    try {
      assertFirecrawlCredentials(this.config);
    } catch (error) {
      configError = error instanceof FirecrawlConfigurationError
        ? error
        : new FirecrawlConfigurationError(String(error));
    }

    const jobReports = await mapWithConcurrency(
      jobs,
      Math.min(8, Math.max(1, this.options.maxConcurrency ?? 3)),
      async (job): Promise<CatalogJobReport> => {
        if (configError) {
          return { job, state: "CONFIGURATION_REQUIRED", extractedCount: 0, acceptedCount: 0, skippedCount: 0, persistedCount: 0, errors: [configError.message] };
        }
        await this.rateLimiter.wait(job.source.id, job.source.rateLimitMs ?? 1_000);
        try {
          const result = await runFirecrawlAgent(unwrapFirecrawlRequest(job), {
            client: this.client,
            config: this.config,
          });
          const rawProducts = unwrapProducts(result.data);
          const jobObservations: CatalogObservationEnvelope[] = [];
          const seenInJob = new Set<string>();
          for (const raw of rawProducts) {
            const observation = normalizeRawProduct(raw, job, this.options.tenantId, this.now());
            if (!observation) continue;
            const duplicateKey = extractionDuplicateKey(observation);
            if (seenInJob.has(duplicateKey)) continue;
            seenInJob.add(duplicateKey);
            jobObservations.push(observation);
            allObservations.push(observation);
            if (observation.supplier) supplierCandidates.set(observation.supplier.key, observation.supplier);
          }
          let persistedCount = 0;
          if (this.options.persist) {
            for (const observation of jobObservations) {
              await recordCatalogObservation(toRegistryObservation(observation));
              persistedCount += 1;
              persistedObservations += 1;
            }
          }
          return {
            job,
            firecrawlJobId: result.jobId,
            state: jobObservations.length ? "COMPLETED" : "EMPTY",
            extractedCount: rawProducts.length,
            acceptedCount: jobObservations.length,
            skippedCount: rawProducts.length - jobObservations.length,
            persistedCount,
            errors: [],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`${job.id}: ${message}`);
          return {
            job,
            state: "FAILED",
            extractedCount: 0,
            acceptedCount: 0,
            skippedCount: 0,
            persistedCount: 0,
            errors: [message],
          };
        }
      },
    );

    // Resolve supplier mappings after extraction so two category/source jobs
    // cannot race and call the same mapping hook twice.
    for (const candidate of supplierCandidates.values()) {
      if (this.options.supplierMapper) {
        try {
          const mapped = await this.options.supplierMapper(candidate);
          supplierMappings.set(candidate.key, mapped || {
            key: candidate.key,
            status: "UNMATCHED",
            note: "No existing supplier match returned",
          });
        } catch (error) {
          supplierMappings.set(candidate.key, {
            key: candidate.key,
            status: "REVIEW_REQUIRED",
            note: error instanceof Error ? error.message : "Supplier mapper failed",
          });
        }
      } else {
        supplierMappings.set(candidate.key, {
          key: candidate.key,
          status: "REVIEW_REQUIRED",
          note: "Supplier mapping hook not configured",
        });
      }
    }

    const observations = [...new Map(allObservations.map((item) => [item.observationKey, item])).values()];
    const products = aggregateProducts(observations);
    const completedAt = this.now();
    return {
      runId: createHash("sha256").update(`${this.options.tenantId}:${runStarted.toISOString()}`).digest("hex").slice(0, 24),
      startedAt: runStarted.toISOString(),
      completedAt: completedAt.toISOString(),
      jobs: jobReports,
      products,
      observations,
      supplierMappings: [...supplierMappings.values()],
      errors,
      counts: {
        jobs: jobs.length,
        completedJobs: jobReports.filter((job) => job.state === "COMPLETED" || job.state === "EMPTY").length,
        failedJobs: jobReports.filter((job) => job.state === "FAILED" || job.state === "CONFIGURATION_REQUIRED").length,
        products: products.length,
        observations: observations.length,
        pricedObservations: observations.filter((observation) => observation.price !== undefined).length,
        rfqRequiredObservations: observations.filter((observation) => observation.price === undefined).length,
        persistedObservations,
      },
    };
  }
}

/** Use Agent Reach's discovered URLs as the input to the Firecrawl fan-out. */
export async function runDiscoveredCatalog(
  input: Omit<FirecrawlCatalogPipelineOptions, "sources"> & { discovery: AgentReachSourceDiscovery },
): Promise<FirecrawlCatalogRunReport> {
  const sources = await input.discovery.discover({ categories: input.categories });
  return new FirecrawlCatalogPipeline({ ...input, sources }).run();
}
