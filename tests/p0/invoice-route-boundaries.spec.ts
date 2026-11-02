import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ actor: vi.fn(), order: vi.fn() }));
vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findFirst: m.order } } }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: vi.fn() }));
vi.mock("@/lib/procurement/network-transaction-ledger", () => ({ appendNetworkTransactionEvent: vi.fn() }));

import { POST } from "@/app/api/v2/invoices/route";

const request = (body: unknown) => new Request("https://hotelsvendors.test/api/v2/invoices", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("invoice date boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "supplier-user", platformRole: "SUPPLIER", supplierId: "supplier-1", tenantId: "supplier-tenant" });
  });

  it("rejects malformed dates before querying the order", async () => {
    const response = await POST(request({ invoiceNumber: "INV-1", orderId: "order-1", issueDate: "not-a-date", subtotal: 100, vatAmount: 14, total: 114 }));
    expect(response.status).toBe(400);
    expect(m.order).not.toHaveBeenCalled();
  });

  it("rejects a due date before the issue date", async () => {
    const response = await POST(request({ invoiceNumber: "INV-2", orderId: "order-1", issueDate: "2026-11-02T00:00:00.000Z", dueDate: "2026-11-01T00:00:00.000Z", subtotal: 100, vatAmount: 14, total: 114 }));
    expect(response.status).toBe(400);
    expect(m.order).not.toHaveBeenCalled();
  });

  it("scopes supplier invoice lookup by the authenticated supplier tenant", async () => {
    m.order.mockResolvedValue(null);
    const response = await POST(request({ invoiceNumber: "INV-TENANT", orderId: "order-1", subtotal: 100, vatAmount: 14, total: 114 }));
    expect(response.status).toBe(409);
    expect(m.order).toHaveBeenCalledWith({
      where: expect.objectContaining({ supplierId: "supplier-1", tenantId: "supplier-tenant" }),
      select: { id: true, tenantId: true, hotelId: true, supplierId: true },
    });
  });
});
