import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ actor: vi.fn(), order: vi.fn(), transaction: vi.fn(), invoiceCreate: vi.fn() }));
vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findFirst: m.order }, $transaction: m.transaction } }));
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
    m.transaction.mockImplementation((work) => work({ invoice: { create: m.invoiceCreate } }));
    m.invoiceCreate.mockResolvedValue({ id: "invoice-1", status: "DRAFT", etaStatus: "PENDING" });
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

  it("allows the authenticated supplier to invoice its guaranteed hotel order across tenant boundaries", async () => {
    m.order.mockResolvedValue({ id: "order-1", tenantId: "hotel-tenant", hotelId: "hotel-1", supplierId: "supplier-1" });
    const response = await POST(request({ invoiceNumber: "INV-CROSS-TENANT", orderId: "order-1", subtotal: 100, vatAmount: 14, total: 114 }));

    expect(response.status).toBe(201);
    expect(m.order).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        supplierId: "supplier-1",
        supplier: { id: "supplier-1", tenantId: "supplier-tenant" },
        status: { in: ["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED", "DELIVERED"] },
        paymentGuaranteed: true,
        deletedAt: null,
      },
      select: { id: true, tenantId: true, hotelId: true, supplierId: true },
    });
    expect(m.invoiceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: "hotel-tenant", supplierId: "supplier-1", orderId: "order-1" }),
    });
  });

  it("denies a different supplier from invoicing the order", async () => {
    m.actor.mockResolvedValue({ id: "other-supplier-user", platformRole: "SUPPLIER", supplierId: "supplier-2", tenantId: "other-supplier-tenant" });
    m.order.mockResolvedValue(null);
    const response = await POST(request({ invoiceNumber: "INV-WRONG-SUPPLIER", orderId: "order-1", subtotal: 100, vatAmount: 14, total: 114 }));

    expect(response.status).toBe(409);
    expect(m.order).toHaveBeenCalledWith({
      where: expect.objectContaining({
        supplierId: "supplier-2",
        supplier: { id: "supplier-2", tenantId: "other-supplier-tenant" },
        paymentGuaranteed: true,
      }),
      select: { id: true, tenantId: true, hotelId: true, supplierId: true },
    });
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("keeps hotel invoice lookups scoped to the authenticated hotel tenant", async () => {
    m.actor.mockResolvedValue({ id: "hotel-user", platformRole: "HOTEL", tenantId: "hotel-tenant" });
    m.order.mockResolvedValue(null);

    const response = await POST(request({ invoiceNumber: "INV-HOTEL-SCOPE", orderId: "order-1", subtotal: 100, vatAmount: 14, total: 114 }));

    expect(response.status).toBe(409);
    expect(m.order).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: "order-1", tenantId: "hotel-tenant", paymentGuaranteed: true }),
      select: { id: true, tenantId: true, hotelId: true, supplierId: true },
    });
  });
});
