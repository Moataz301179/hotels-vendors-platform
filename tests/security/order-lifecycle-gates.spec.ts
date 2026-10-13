import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  order: vi.fn(),
  count: vi.fn(),
  createGrn: vi.fn(),
  updateItem: vi.fn(),
  updateOrder: vi.fn(),
  transaction: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.user },
    order: { findFirst: mocks.order },
    goodsReceiptNote: { count: mocks.count },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: (request: NextRequest) => unknown) => handler,
  authenticate: vi.fn(async () => ({ userId: "receiver-1", tenantId: "hotel-tenant", platformRole: "HOTEL" })),
  requirePermission: vi.fn(async () => undefined),
  validateBody: (schema: { parse: (value: unknown) => unknown }, body: unknown) => schema.parse(body),
  error: (message: string, status = 500) => Response.json({ success: false, error: message }, { status }),
  success: (data: unknown, status = 200) => Response.json({ success: true, data }, { status }),
}));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: mocks.audit }));

import { POST } from "../../app/api/v1/grn/route";

const baseOrder = {
  id: "corder1",
  tenantId: "hotel-tenant",
  hotelId: "hotel-1",
  supplierId: "supplier-1",
  status: "IN_TRANSIT",
  paymentGuaranteed: true,
  items: [{ id: "citem01", productId: "cprod01", quantity: 4, receivedQuantity: 0 }],
  tripStops: [{ id: "cstop01", status: "POD_CAPTURED", deliveryProofs: [{ id: "cproof1" }] }],
};

const body = {
  orderId: "corder1",
  lineItems: [{ orderItemId: "citem01", productId: "cprod01", orderedQuantity: 4, receivedQuantity: 4, acceptedQuantity: 4, rejectedQuantity: 0 }],
};

function request(input = body) {
  return new NextRequest("https://hotelsvendors.com/api/v1/grn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

describe("PO delivery to GRN lifecycle gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user.mockResolvedValue({ id: "receiver-1", hotelId: "hotel-1" });
    mocks.order.mockResolvedValue(structuredClone(baseOrder));
    mocks.count.mockResolvedValue(0);
    mocks.audit.mockResolvedValue("audit-1");
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      $queryRaw: vi.fn(),
      goodsReceiptNote: { create: mocks.createGrn },
      orderItem: { update: mocks.updateItem },
      order: { findFirst: vi.fn(async () => structuredClone(baseOrder)), update: mocks.updateOrder },
    }));
    mocks.createGrn.mockResolvedValue({ id: "grn-1", grnNumber: "GRN-000001", status: "ACCEPTED", lineItems: [] });
  });

  it("blocks receiving until payment is guaranteed", async () => {
    mocks.order.mockResolvedValue({ ...structuredClone(baseOrder), paymentGuaranteed: false });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("blocks receiving without a carrier proof", async () => {
    mocks.order.mockResolvedValue({ ...structuredClone(baseOrder), tripStops: [{ id: "stop-1", status: "ARRIVED", deliveryProofs: [] }] });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a line item whose product or ordered quantity is not from the PO", async () => {
    const response = await POST(request({ ...body, lineItems: [{ ...body.lineItems[0], productId: "cother1" }] }));
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("creates an audited GRN and advances the order after proof and payment gates pass", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(mocks.createGrn).toHaveBeenCalled();
    expect(mocks.updateItem).toHaveBeenCalledWith({ where: { id: "citem01" }, data: { receivedQuantity: { increment: 4 } } });
    expect(mocks.updateOrder).toHaveBeenCalledWith({ where: { id: "corder1" }, data: { status: "DELIVERED" } });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: "GOODS_RECEIPT_NOTE", tenantId: "hotel-tenant" }), expect.anything());
  });
});
