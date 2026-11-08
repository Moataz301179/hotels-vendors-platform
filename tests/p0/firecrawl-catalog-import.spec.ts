import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Firecrawl catalogue import contract.
 *
 * Proves:
 * - Permission is enforced before any query runs.
 * - Re-running the same page updates records instead of duplicating them.
 * - Imported records are INACTIVE and never promoted to ACTIVE.
 * - Provenance (source URL, provider, observed-at) is preserved.
 * - The audit entry states explicitly that nothing is customer-facing.
 */

const m = vi.hoisted(() => ({
  supplierFindFirst: vi.fn(),
  supplierCreate: vi.fn(),
  productFindUnique: vi.fn(),
  productCreate: vi.fn(),
  productUpdate: vi.fn(),
  auditLogCreate: vi.fn(),
  hasPermission: vi.fn(),
}));

vi.mock("@/lib/auth/rbac", () => ({ hasPermission: m.hasPermission }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: { findFirst: m.supplierFindFirst, create: m.supplierCreate },
    product: { findUnique: m.productFindUnique, create: m.productCreate, update: m.productUpdate },
    auditLog: { create: m.auditLogCreate },
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
    m.supplierFindFirst.mockResolvedValue({ id: "supplier-1" });
    m.productFindUnique.mockResolvedValue(null);
    m.productCreate.mockResolvedValue({ id: "product-1" });
    m.productUpdate.mockResolvedValue({ id: "product-1" });
    m.auditLogCreate.mockResolvedValue({});
  });

  it("denies an unauthorized caller before touching the database", async () => {
    m.hasPermission.mockResolvedValue(false);
    await expect(
      importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] }),
    ).rejects.toThrow("Permission denied: product:create");
    expect(m.productCreate).not.toHaveBeenCalled();
    expect(m.productFindUnique).not.toHaveBeenCalled();
  });

  it("imports as INACTIVE — never customer-facing", async () => {
    const outcome = await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    expect(m.productCreate).toHaveBeenCalledTimes(1);
    const payload = m.productCreate.mock.calls[0][0].data;
    expect(payload.status).toBe("INACTIVE");
    expect(payload.source).toBe("ECOMMERCE");
    expect(payload.sourceProvider).toBe("firecrawl");
    expect(outcome.summary.recordsImported).toBe(1);
  });

  it("updates on re-run instead of duplicating", async () => {
    m.productFindUnique.mockResolvedValue({ id: "product-1" });
    const outcome = await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    expect(m.productUpdate).toHaveBeenCalledTimes(1);
    expect(m.productCreate).not.toHaveBeenCalled();
    expect(outcome.summary.recordsUpdated).toBe(1);
    expect(outcome.summary.recordsImported).toBe(0);
  });

  it("never promotes a record to ACTIVE on re-run", async () => {
    m.productFindUnique.mockResolvedValue({ id: "product-1" });
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    expect(m.productUpdate.mock.calls[0][0].data.status).toBe("INACTIVE");
  });

  it("preserves provenance in the specs payload", async () => {
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    const payload = m.productCreate.mock.calls[0][0].data;
    const specs = JSON.parse(payload.specs);
    expect(specs.provider).toBe("firecrawl");
    expect(specs.sourceUrl).toBe("https://supplier.example.com/p/1");
    expect(specs.observedAt).toBe("2026-11-08T00:00:00.000Z");
    expect(specs.unverified).toBe(true);
  });

  it("imports quote-only records without a price, flagged for quotation", async () => {
    const outcome = await importCatalogRecords({
      tenantId: "tenant-1",
      actor,
      records: [record({ price: null })],
    });
    expect(m.productCreate).toHaveBeenCalledTimes(1);
    const payload = m.productCreate.mock.calls[0][0].data;
    expect(payload.unitPrice).toBeNull();
    expect(payload.pricingMode).toBe("RFQ");
    expect(JSON.parse(payload.specs).requestForQuote).toBe(true);
    expect(outcome.summary.quoteOnly).toBe(1);
    expect(outcome.summary.rejected).toHaveLength(0);
  });

  it("maps scraped categories onto the HV vocabulary", async () => {
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record({ category: "Beverages" })] });
    expect(m.productCreate.mock.calls[0][0].data.category).toBe("F_AND_B");
  });

  it("uses a stable sku derived from the source hash", async () => {
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    expect(m.productCreate.mock.calls[0][0].data.sku).toMatch(/^FC-[0-9a-f]{12}$/);
  });

  it("records an audit entry that states nothing is customer-facing", async () => {
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    const changes = m.auditLogCreate.mock.calls[0][0].data.changes;
    expect(changes.provider).toBe("firecrawl");
    expect(changes.customerFacing).toBe(false);
    expect(changes.imported).toBe(1);
  });

  it("creates an unverified supplier stub when none is supplied", async () => {
    m.supplierFindFirst.mockResolvedValue(null);
    m.supplierCreate.mockResolvedValue({ id: "supplier-new" });
    await importCatalogRecords({ tenantId: "tenant-1", actor, records: [record()] });
    const payload = m.supplierCreate.mock.calls[0][0].data;
    expect(payload.isVerified).toBe(false);
    expect(payload.status).toBe("PENDING");
  });
});
