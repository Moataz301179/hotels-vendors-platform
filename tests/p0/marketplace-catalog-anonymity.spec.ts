import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ actor: vi.fn(), products: vi.fn(), resolved: vi.fn() }));
vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/catalog/resolved-product-evidence", () => ({ resolvedProductEvidenceIds: m.resolved }));
vi.mock("@/lib/prisma", () => ({ prisma: { product: { findMany: m.products } } }));

import { GET } from "@/app/api/v2/marketplace/route";

describe("buyer marketplace catalog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "buyer-1", tenantId: "hotel-1", platformRole: "HOTEL" });
    m.products.mockResolvedValue([{ id: "product-1", uuid: null, sku: "TOWEL-01", name: "Bath towel", description: "Hotel towel", category: "GUEST_SUPPLIES", unitOfMeasure: "piece", images: JSON.stringify(["https://supplier.example/media/towels.jpg"]), sourceKey: "https://supplier.example/products/towels", supplier: { website: "https://supplier.example" } }]);
    m.resolved.mockResolvedValue(new Set(["product-1"]));
  });

  it("returns verified catalog imagery through an opaque first-party path", async () => {
    const response = await GET(new Request("https://hotelsvendors.test/api/v2/marketplace"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.products[0].images).toEqual(["/api/v2/catalog/products/product-1/images/0"]);
    expect(JSON.stringify(body)).not.toContain("supplier.example");
  });
});
