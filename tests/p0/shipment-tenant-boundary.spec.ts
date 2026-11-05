import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ actor: vi.fn(), assignment: vi.fn(), shipment: vi.fn() }));
vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/prisma", () => ({ prisma: { carrierOrderAssignment: { findFirst: m.assignment }, shipment: { create: m.shipment } } }));
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
    m.assignment.mockResolvedValue(null);
  });

  it("denies a shipment without an accepted assignment for the carrier tenant", async () => {
    const response = await POST(request({ corridor: "Cairo", originHub: "A", destinationHub: "B", orderIds: ["order-from-tenant-b"] }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "ACCEPTED_CARRIER_ASSIGNMENT_REQUIRED" });
    expect(m.assignment).toHaveBeenCalledWith({
      where: { orderId: "order-from-tenant-b", carrierTenantId: "carrier-tenant-a", status: "ACCEPTED", deletedAt: null },
      select: { id: true, orderId: true },
    });
    expect(m.shipment).not.toHaveBeenCalled();
  });

  it("rejects malformed shipment measurements before querying orders", async () => {
    const response = await POST(request({
      corridor: "Cairo",
      originHub: "A",
      destinationHub: "B",
      estimatedArrival: "not-a-date",
      totalWeightKg: "NaN",
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "estimatedArrival must be a valid date" });
    expect(m.assignment).not.toHaveBeenCalled();
    expect(m.shipment).not.toHaveBeenCalled();
  });

  it("rejects duplicate order ids before creating a shipment", async () => {
    const response = await POST(request({
      corridor: "Cairo",
      originHub: "A",
      destinationHub: "B",
      orderIds: ["order-a", "order-a"],
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "orderIds must not contain duplicates" });
    expect(m.assignment).not.toHaveBeenCalled();
    expect(m.shipment).not.toHaveBeenCalled();
  });
});
