import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  products: vi.fn(),
  orders: vi.fn(),
  invoices: vi.fn(),
  opportunities: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: m.products },
    order: { findMany: m.orders },
    invoice: { findMany: m.invoices },
    opportunity: { findMany: m.opportunities },
  },
}));

import { GET } from "@/app/api/v2/alerts/route";

describe("tenant operational alerts contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "user-1", tenantId: "tenant-1", platformRole: "HOTEL" });
    m.products.mockResolvedValue([{ id: "product-1", name: "Bath towels", sku: "TOW-1", stockQuantity: 2, reorderPoint: 10 }]);
    m.orders.mockResolvedValue([{ id: "order-1", orderNumber: "HV-1001", total: "2500", currency: "EGP", createdAt: new Date("2026-10-12T10:00:00Z") }]);
    m.invoices.mockResolvedValue([{ id: "invoice-1", invoiceNumber: "INV-1", total: "900", currency: "EGP", dueDate: new Date("2026-10-01T00:00:00Z") }]);
    m.opportunities.mockResolvedValue([{ id: "opp-1", title: "Consolidate towel demand", status: "ACTION_READY", potentialImpact: "700" }]);
  });

  it("rejects unauthenticated reads before querying operational records", async () => {
    m.actor.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(m.products).not.toHaveBeenCalled();
    expect(m.orders).not.toHaveBeenCalled();
  });

  it("returns only tenant-derived inventory, approval, cashflow and intelligence signals", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe("tenant operational records");
    expect(body.alerts.map((alert: { kind: string }) => alert.kind)).toEqual([
      "inventory", "approval", "cashflow", "intelligence",
    ]);
    expect(body.alerts[0]).toMatchObject({ id: "inventory:product-1", severity: "warning" });
    expect(body.alerts[2]).toMatchObject({ id: "cashflow:invoice-1", severity: "critical" });
    expect(m.products.mock.calls[0][0].where).toMatchObject({ tenantId: "tenant-1", deletedAt: null, status: "ACTIVE" });
    expect(m.orders.mock.calls[0][0].where).toMatchObject({ tenantId: "tenant-1", status: "PENDING_APPROVAL" });
    expect(m.invoices.mock.calls[0][0].where).toMatchObject({ tenantId: "tenant-1", paymentStatus: { in: ["UNPAID", "OVERDUE", "PARTIALLY_PAID"] } });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
