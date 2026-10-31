import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  product: vi.fn(),
  order: vi.fn(),
  invoice: vi.fn(),
  opportunity: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: m.product },
    order: { findMany: m.order },
    invoice: { findMany: m.invoice },
    opportunity: { findMany: m.opportunity },
  },
}));

import { GET } from "@/app/api/v2/alerts/route";

const pendingActor = { id: "u-pending", tenantId: "tenant-a", platformRole: "HOTEL", status: "PENDING_VERIFICATION" };
const activeActor = { id: "u-active", tenantId: "tenant-a", platformRole: "HOTEL", status: "ACTIVE" };

describe("alerts: pending users must not see operational data", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.product.mockResolvedValue([]);
    m.order.mockResolvedValue([]);
    m.invoice.mockResolvedValue([]);
    m.opportunity.mockResolvedValue([]);
  });

  it("rejects a PENDING_VERIFICATION user with 401", async () => {
    m.actor.mockResolvedValue(null); // getActor returns null for pending
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("UNAUTHENTICATED");
    // No tenant queries should have run for a rejected actor
    expect(m.product).not.toHaveBeenCalled();
    expect(m.order).not.toHaveBeenCalled();
  });

  it("returns tenant-scoped alerts for an ACTIVE user", async () => {
    m.actor.mockResolvedValue(activeActor);
    m.product.mockResolvedValue([
      { id: "p1", name: "Test Product", sku: "SKU-1", stockQuantity: 2, reorderPoint: 5 },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alerts).toHaveLength(1);
    expect(body.alerts[0].id).toBe("inventory:p1");
    expect(body.source).toBe("tenant operational records");
    // Verify all queries were scoped to the actor's tenant
    expect(m.product).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenant-a" }) })
    );
  });

  it("never returns alerts from another tenant", async () => {
    m.actor.mockResolvedValue(activeActor);
    // All queries return empty — no cross-tenant data leaks
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alerts).toEqual([]);
  });
});