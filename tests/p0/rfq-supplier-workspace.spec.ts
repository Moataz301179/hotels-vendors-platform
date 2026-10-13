import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  grants: vi.fn(),
  rfqs: vi.fn(),
  products: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    rfqSupplierAccess: { findMany: m.grants },
    rfqRequest: { findMany: m.rfqs },
    product: { findMany: m.products },
  },
}));

import { GET } from "@/app/api/v2/rfq/route";

describe("supplier RFQ workspace", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({
      id: "supplier-user",
      tenantId: "supplier-tenant",
      platformRole: "SUPPLIER",
      supplierId: "supplier-a",
    });
    m.grants.mockResolvedValue([{ rfqId: "rfq-a" }]);
    m.rfqs.mockResolvedValue([{ id: "rfq-a", productId: "product-a", supplierId: "supplier-a" }]);
    m.products.mockResolvedValue([{ id: "product-a", name: "Bath towel", sku: "BT-100", unitOfMeasure: "piece" }]);
  });

  it("returns only granted RFQs with the product details required to quote", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(m.rfqs).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ["rfq-a"] }, supplierId: "supplier-a", deletedAt: null },
    }));
    expect(m.products).toHaveBeenCalledWith({
      where: { id: { in: ["product-a"] }, supplierId: "supplier-a", deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, sku: true, unitOfMeasure: true },
    });
    await expect(response.json()).resolves.toEqual({
      rfqs: [{ id: "rfq-a", productId: "product-a", supplierId: "supplier-a", product: { id: "product-a", name: "Bath towel", sku: "BT-100", unitOfMeasure: "piece" } }],
    });
  });
});
