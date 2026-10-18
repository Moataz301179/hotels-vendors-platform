import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(), orderCount: vi.fn(), rfqCount: vi.fn(), opportunityCount: vi.fn(), savingsAggregate: vi.fn(),
  productCount: vi.fn(), supplierCount: vi.fn(), shipmentCount: vi.fn(), fundingCount: vi.fn(), potentialAggregate: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  order: { count: m.orderCount }, rfqRequest: { count: m.rfqCount }, opportunity: { count: m.opportunityCount, aggregate: m.potentialAggregate },
  savingsLedger: { aggregate: m.savingsAggregate }, product: { count: m.productCount }, supplier: { count: m.supplierCount },
  shipment: { count: m.shipmentCount }, factoringRequest: { count: m.fundingCount },
} }));

import { GET } from "@/app/api/v2/dashboard/route";

describe("dashboard role context", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "user-1", tenantId: "hotel-1", platformRole: "HOTEL", role: "RECEIVING_CLERK" });
    [m.orderCount, m.rfqCount, m.opportunityCount, m.productCount, m.supplierCount, m.shipmentCount, m.fundingCount].forEach((fn) => fn.mockResolvedValue(0));
    m.savingsAggregate.mockResolvedValue({ _sum: { realizedAmount: 0, verifiedAmount: 0, potentialSaving: 0 } });
    m.potentialAggregate.mockResolvedValue({ _sum: { potentialImpact: 0 } });
  });

  it("returns organization role for a scoped workspace", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ role: "HOTEL", organizationRole: "RECEIVING_CLERK" });
  });
});
