import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ orderItems: vi.fn(), products: vi.fn(), orders: vi.fn(), properties: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    orderItem: { findMany: mocks.orderItems },
    product: { findMany: mocks.products },
    order: { findMany: mocks.orders },
    property: { findMany: mocks.properties },
  },
}));

import { aggregateHotelDemand } from "@/lib/demand/aggregation";

describe("demand price aggregation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.orderItems.mockResolvedValue([
      { orderId: "egp-priced", productId: "product-1", quantity: 100, unitPrice: 10 },
      { orderId: "egp-unpriced", productId: "product-1", quantity: 100, unitPrice: null },
      { orderId: "usd-priced", productId: "product-1", quantity: 50, unitPrice: 2 },
    ]);
    mocks.products.mockResolvedValue([{ id: "product-1", sku: "SKU-1", name: "Test product", category: "FOOD", unitOfMeasure: "unit" }]);
    mocks.orders.mockResolvedValue([
      { id: "egp-priced", hotelId: "hotel-1", propertyId: null, supplierId: "supplier-1", deliveryDate: null, currency: "EGP" },
      { id: "egp-unpriced", hotelId: "hotel-2", propertyId: null, supplierId: "supplier-1", deliveryDate: null, currency: "EGP" },
      { id: "usd-priced", hotelId: "hotel-3", propertyId: null, supplierId: "supplier-2", deliveryDate: null, currency: "USD" },
    ]);
    mocks.properties.mockResolvedValue([]);
  });

  it("keeps currencies separate and excludes unpriced units from the weighted average", async () => {
    const demand = await aggregateHotelDemand("tenant-1", { minHotels: 1 });
    const egp = demand.find((row) => row.currency === "EGP");
    const usd = demand.find((row) => row.currency === "USD");
    expect(egp).toMatchObject({ requestedQuantity: 200, pricedQuantity: 100, unpricedQuantity: 100, currentSpend: 1000, weightedUnitPrice: 10 });
    expect(usd).toMatchObject({ requestedQuantity: 50, pricedQuantity: 50, unpricedQuantity: 0, currentSpend: 100, weightedUnitPrice: 2 });
  });

  it("reports no weighted price when all purchases are unpriced", async () => {
    mocks.orderItems.mockResolvedValue([{ orderId: "egp-unpriced", productId: "product-1", quantity: 100, unitPrice: null }]);
    mocks.orders.mockResolvedValue([{ id: "egp-unpriced", hotelId: "hotel-1", propertyId: null, supplierId: "supplier-1", deliveryDate: null, currency: "EGP" }]);
    const demand = await aggregateHotelDemand("tenant-1", { minHotels: 1 });
    expect(demand[0]).toMatchObject({ pricedQuantity: 0, unpricedQuantity: 100, currentSpend: 0, weightedUnitPrice: null });
  });
});
