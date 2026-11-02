import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ actor: vi.fn(), orders: vi.fn(), shipment: vi.fn() }));
vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findMany: m.orders }, shipment: { create: m.shipment } } }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: vi.fn() }));

import { POST } from "@/app/api/v2/shipments/route";

const request = (body: unknown) => new Request("https://hotelsvendors.test/api/v2/shipments", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("shipment tenant boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "carrier-user", tenantId: "carrier-tenant-a", platformRole: "SHIPPING" });
    m.orders.mockResolvedValue([]);
  });

  it("denies a shipment containing an order outside the carrier tenant", async () => {
    const response = await POST(request({ corridor: "Cairo", originHub: "A", destinationHub: "B", orderIds: ["order-from-tenant-b"] }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "One or more orders are outside your tenant or unavailable" });
    expect(m.orders).toHaveBeenCalledWith({
      where: { id: { in: ["order-from-tenant-b"] }, tenantId: "carrier-tenant-a", deletedAt: null },
      select: { id: true },
    });
    expect(m.shipment).not.toHaveBeenCalled();
  });
});
