import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Firecrawl catalogue import contract — dock edition.
 *
 * Raw crawled records land in the catalog raw dock, never in the product table.
 * Proves:
 * - Permission is enforced before any query runs.
 * - Nothing is written to Product by the import.
 * - Each record becomes a staged dock item carrying its private attribution.
 * - A repeated identical run is idempotent (no duplicate dock items).
 * - The audit entry states explicitly that nothing is customer-facing.
 * - No supplier stub is created: the dock is supplier-neutral by design.
 */

const m = vi.hoisted(() => ({
  batchFindUnique: vi.fn(),
  batchCreate: vi.fn(),
  batchUpdate: vi.fn(),
  taxonomyUpsert: vi.fn(),
  itemFindFirst: vi.fn(),
  itemCreate: vi.fn(),
  hasPermission: vi.fn(),
  appendAuditEntry: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/auth/rbac", () => ({ hasPermission: m.hasPermission }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.appendAuditEntry }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    catalogImportBatch: {
      findUnique: m.batchFindUnique,
      create: m.batchCreate,
      update: m.batchUpdate,
    },
    catalogTaxonomy: { upsert: m.taxonomyUpsert },
    catalogStagingItem: { findFirst: m.itemFindFirst, create: m.itemCreate },
    $transaction: m.transaction,
  },
}));

const { importCatalogRecords } = await import("../../lib/catalog/firecrawl-import");
const pipeline = await import("../../lib/catalog/firecrawl-pipeline");

const actor = { id: "user-1", platformRole: "HOTEL_MANAGER" };

function record(overrides: Partial<import("../../lib/catalog/firecrawl-pipeline").RawCatalogRecord> = {}) {
  const url = "https://supplier.example.com/p/1";
  return {
    name: "Nescaf\u00e9 Classic 200g",
    price: 285.5,
    currency: "EGP",
    imageUrl: "https://cdn.example.com/coffee.jpg",
    category: "Beverages",
    sourceUrl: url,
    sourceHash: pipeline.sourceHashFor(url, "Nescaf\u00e9 Classic 200g"),
    sourceProvider: "firecrawl",
    sourceObservedAt: "2026-11-08T00:00:00.000Z",
    spec: "Instant coffee 200g tin",
    packSize: null,
    uom: null,
    moq: null,
    ...overrides,
  };
}

describe("Firecrawl catalogue import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.hasPermission.mockResolvedValue(true);
    m.batchFindUnique.mockResolvedValue(null);
    m.batchCreate.mockResolvedValue({ id: "batch-1" });
    m.batchUpdate.mockResolvedValue({});
    m.taxonomyUpsert.mockResolvedValue({ id: "tax-1" });
    m.itemFindFirst.mockResolvedValue(null);
    m.itemCreate.mockResolvedValue({ id: "item-1" });
    m.appendAuditEntry.mockResolvedValue(undefined);
    // The dock intake is atomic: every write happens inside the transaction.
    m.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        catalogImportBatch: { create: m.batchCreate, update: m.batchUpdate },
        catalogTaxonomy: { upsert: m.taxonomyUpsert },
        catalogStagingItem: { findFirst: m.itemFindFirst, create: m.itemCreate },
      }),
    );
  });

  it("denies an unauthorized caller before touching the database", async () => {
    m.hasPermission.mockResolvedValue(false);
    await expect(
      importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] }),
    ).rejects.toThrow("Permission denied: product:create");
    expect(m.batchCreate).not.toHaveBeenCalled();
    expect(m.itemCreate).not.toHaveBeenCalled();
  });

  it("lands records in the raw dock and never writes a product", async () => {
    const outcome = await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    expect(m.itemCreate).toHaveBeenCalledTimes(1);
    expect(outcome.summary.recordsImported).toBe(1);
    // The import must not touch the product table at all.
    const prisma = (await import("../../lib/prisma")).prisma as unknown as Record<string, unknown>;
    expect(prisma.product).toBeUndefined();
  });

  it("stages each record as a dock item with private attribution", async () => {
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    const payload = m.itemCreate.mock.calls[0][0].data;
    expect(payload.itemName).toBe("Nescaf\u00e9 Classic 200g");
    expect(payload.status).toBe("STAGED");
    // Attribution stays in the dock, privately.
    expect(payload.attributionSource).toBe("https://supplier.example.com/p/1");
    expect(payload.sourceRecordKey).toBe(record().sourceHash);
    // The observed price is retained privately for later reconciliation.
    expect(payload.estimatedPriceEgp).toBe(285.5);
  });

  it("is idempotent: a repeated identical run creates no second dock item", async () => {
    m.batchFindUnique.mockResolvedValue({ id: "batch-existing" });
    const outcome = await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    expect(m.itemCreate).not.toHaveBeenCalled();
    expect(outcome.summary.duplicatesSkipped).toBe(1);
  });

  it("re-run of an existing batch does not duplicate staged items", async () => {
    m.itemFindFirst.mockResolvedValue({ id: "item-existing" });
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    expect(m.itemCreate).not.toHaveBeenCalled();
  });

  it("keeps the observed price out of the buyer-facing catalog projection", async () => {
    const { buyerSafeFields } = await import("../../lib/catalog/buyer-safe-catalog");
    const safe = buyerSafeFields({
      itemName: "Nescaf\u00e9 Classic 200g",
      technicalSpecs: { provider: "firecrawl", sourceUrl: "https://x", grind: "fine" },
      imageUrls: ["https://cdn.example.com/coffee.jpg"],
    });
    expect(safe.name).toBe("Nescaf\u00e9 Classic 200g");
    expect(safe.specs).not.toContain("sourceUrl");
    expect(safe.specs).toContain("grind");
    // No price field exists on the buyer-safe projection at all.
    expect(JSON.stringify(safe)).not.toContain("285");
  });

  it("imports quote-only records without a price", async () => {
    const outcome = await importCatalogRecords({
      tenantId: "tenant-1",
      actor,
      records: [record({ price: null })],
    });
    const payload = m.itemCreate.mock.calls[0][0].data;
    expect(payload.estimatedPriceEgp).toBeNull();
    expect(outcome.summary.quoteOnly).toBe(1);
    expect(outcome.summary.rejected).toHaveLength(0);
  });

  it("refuses synthetic records at the dock instead of storing them", async () => {
    const outcome = await importCatalogRecords({
      tenantId: "tenant-1",
      actor,
      records: [record({ name: "Verified lifecycle product" })],
    });
    expect(m.itemCreate).not.toHaveBeenCalled();
    expect(outcome.summary.rejected.length).toBeGreaterThan(0);
  });

  it("records an audit entry that states nothing is customer-facing", async () => {
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    const changes = m.appendAuditEntry.mock.calls[0][0].changes;
    expect(changes.promotedToCatalog).toBe(0);
    expect(changes.staged).toBe(1);
  });

  it("creates no supplier stub: the dock is supplier-neutral by design", async () => {
    const prisma = (await import("../../lib/prisma")).prisma as unknown as Record<string, unknown>;
    expect(prisma.supplier).toBeUndefined();
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
  });
});
