import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  hotel: vi.fn(),
  product: vi.fn(),
  baseline: vi.fn(),
  comparisonCreate: vi.fn(),
  audit: vi.fn(),
  permission: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    hotel: { findFirst: m.hotel },
    product: { findFirst: m.product },
    contractRateBaseline: { findFirst: m.baseline },
    connectedSupplierPriceComparison: { create: m.comparisonCreate },
    $transaction: m.transaction,
  },
}));

import { GET } from "@/app/api/v2/supplier/price-comparison/[productId]/route";

const actor = { id: "buyer", tenantId: "tenant", platformRole: "HOTEL", role: "DEPARTMENT_HEAD" };

function makeRequest(productId: string, supplierId?: string, quantity = 1) {
  const url = new URL(`https://hotelsvendors.com/api/v2/supplier/price-comparison/${encodeURIComponent(productId)}`);
  if (supplierId) url.searchParams.set("supplierId", supplierId);
  if (quantity !== 1) url.searchParams.set("quantity", String(quantity));
  return new Request(url.toString(), { method: "GET" });
}

describe("supplier price comparison boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(actor);
    m.audit.mockResolvedValue({});
    m.permission.mockResolvedValue(undefined);
    m.transaction.mockImplementation((fn: any) => fn({ connectedSupplierPriceComparison: { create: m.comparisonCreate } }));
    m.hotel.mockResolvedValue({ id: "hotel-1", status: "ACTIVE" });
    m.product.mockResolvedValue({ id: "p1", supplierId: "supplier-1", unitPrice: 90, name: "Test Product", supplier: { priceFeedConsentStatus: "GRANTED", priceFeedConsentExpiresAt: new Date("2099-01-01") } });
    m.baseline.mockResolvedValue({ id: "baseline-1", unitPrice: 100, supplierId: "supplier-1" });
    m.comparisonCreate.mockResolvedValue({ id: "comparison-1" });
  });

  it("rejects unauthenticated comparison", async () => {
    m.actor.mockResolvedValue(null);
    const response = await GET(makeRequest("p1"), { params: { productId: "p1" } });
    expect(response.status).toBe(401);
    expect(m.hotel).not.toHaveBeenCalled();
  });

  it("requires price:compare permission", async () => {
    m.permission.mockRejectedValue(new PermissionDeniedError("denied"));
    const response = await GET(makeRequest("p1"), { params: { productId: "p1" } });
    expect(response.status).toBe(403);
    expect(m.product).not.toHaveBeenCalled();
  });

  it("returns 404 when product is missing", async () => {
    m.product.mockResolvedValue(null);
    const response = await GET(makeRequest("missing"), { params: { productId: "missing" } });
    expect(response.status).toBe(404);
    expect(m.baseline).not.toHaveBeenCalled();
  });

  it("returns 409 when historical baseline is missing", async () => {
    m.baseline.mockResolvedValue(null);
    const response = await GET(makeRequest("p1"), { params: { productId: "p1" } });
    expect(response.status).toBe(409);
    expect(m.comparisonCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when supplier does not supply the product", async () => {
    m.product.mockResolvedValue({ id: "p1", supplierId: "supplier-2", unitPrice: 90, name: "Test Product", supplier: { priceFeedConsentStatus: "GRANTED", priceFeedConsentExpiresAt: new Date("2099-01-01") } });
    const response = await GET(makeRequest("p1", "supplier-1"), { params: { productId: "p1" } });
    expect(response.status).toBe(409);
    expect(m.comparisonCreate).not.toHaveBeenCalled();
  });

  it("creates a price comparison and returns it", async () => {
    const response = await GET(makeRequest("p1", "supplier-1", 2), { params: { productId: "p1" } });
    expect(response.status).toBe(200);
    expect(m.comparisonCreate.mock.calls[0][0].data).toMatchObject({
      tenantId: "tenant",
      hotelId: "hotel-1",
      supplierId: "supplier-1",
      productId: "p1",
      historicalPrice: 100,
      currentSupplierPrice: 90,
      quantity: 2,
      comparisonBasis: "CONTRACT_BASELINE",
      priceDifference: 10,
      percentageChange: 0.1,
      status: "CALCULATED",
    });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: "CONNECTED_SUPPLIER_PRICE_COMPARISON", actionType: "CREATED" }));
  });

  it("fails closed when supplier consent is revoked or expired", async () => {
    m.product.mockResolvedValue({ id: "p1", supplierId: "supplier-1", unitPrice: 90, name: "Test Product", supplier: { priceFeedConsentStatus: "REVOKED", priceFeedConsentExpiresAt: null } });
    const response = await GET(makeRequest("p1"), { params: { productId: "p1" } });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "SUPPLIER_PRICE_FEED_NOT_CONSENTED" });
    expect(m.comparisonCreate).not.toHaveBeenCalled();
  });
});
