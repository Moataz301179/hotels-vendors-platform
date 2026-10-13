import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  permission: vi.fn(),
  user: vi.fn(),
  quote: vi.fn(),
  product: vi.fn(),
  orderCreate: vi.fn(),
  orderUpdate: vi.fn(),
  hotelFind: vi.fn(),
  hotelUpdate: vi.fn(),
  quoteUpdate: vi.fn(),
  rfqUpdate: vi.fn(),
  transaction: vi.fn(),
  evaluateAuthority: vi.fn(),
  credit: vi.fn(),
  audit: vi.fn(),
  idempotency: vi.fn(),
  complete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mocks.user },
    procurementQuote: { findFirst: mocks.quote },
    product: { findFirst: mocks.product },
    order: { update: mocks.orderUpdate },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: (request: NextRequest, ctx?: unknown) => unknown) => handler,
  authenticate: mocks.auth,
  requirePermission: mocks.permission,
  requireIdempotencyKey: mocks.idempotency,
  completeIdempotency: mocks.complete,
  error: (message: string, status = 500) => Response.json({ success: false, error: message }, { status }),
  success: (data: unknown, status = 200) => Response.json({ success: true, data }, { status }),
}));
vi.mock("@/lib/credit-gate", () => ({ checkCreditLimit: mocks.credit }));
vi.mock("@/lib/auth/authority-matrix", () => ({ evaluateAuthority: mocks.evaluateAuthority }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: mocks.audit }));

import { POST } from "../../app/api/v1/rfq/quotes/[id]/accept/route";

const createdOrder = {
  id: "corder1",
  orderNumber: "PO-1",
  tenantId: "hotel-tenant",
  hotelId: "chotel01",
  supplierId: "csupplier",
  requesterId: "cbuyer01",
  subtotal: 675,
  vatAmount: 94.5,
  total: 769.5,
  currency: "EGP",
  status: "DRAFT",
  paymentGuaranteed: false,
  items: [{ id: "citem01", productId: "cprod01", quantity: 5, unitPrice: 125, total: 625 }],
};

function request(body: unknown) {
  return new NextRequest("https://hotelsvendors.com/api/v1/rfq/quotes/cquote1/accept", {
    method: "POST",
    headers: { "content-type": "application/json", "x-idempotency-key": "accept-quote-1" },
    body: JSON.stringify(body),
  });
}

describe("RFQ quote acceptance and PO creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "cbuyer01", tenantId: "hotel-tenant", platformRole: "HOTEL" });
    mocks.permission.mockResolvedValue(undefined);
    mocks.user.mockResolvedValue({ id: "cbuyer01", role: "DEPARTMENT_HEAD", hotelId: "chotel01" });
    mocks.quote.mockResolvedValue({
      id: "cquote1",
      rfqId: "crfq001",
      tenantId: "hotel-tenant",
      supplierId: "csupplier",
      buyerId: "cbuyer01",
      unitPrice: 125,
      quantity: 5,
      currency: "EGP",
      leadTimeDays: 2,
      deliveryFee: 50,
      validUntil: null,
      status: "SUBMITTED",
      rfq: { id: "crfq001", productId: "cprod01" },
    });
    mocks.product.mockResolvedValue({ id: "cprod01", supplierId: "csupplier", minOrderQty: 1, stockQuantity: 100, unitOfMeasure: "unit" });
    mocks.credit.mockResolvedValue({ allowed: true, available: 10_000 });
    mocks.idempotency.mockResolvedValue("accept-quote-1");
    mocks.complete.mockResolvedValue(undefined);
    mocks.evaluateAuthority.mockResolvedValue({ action: "AUTO_APPROVE", canProceed: true, requiresAction: false, rule: null });
    mocks.audit.mockResolvedValue(undefined);
    mocks.orderCreate.mockResolvedValue(createdOrder);
    mocks.orderUpdate.mockResolvedValue({ ...createdOrder, status: "APPROVED" });
    mocks.hotelFind.mockResolvedValue({ creditLimit: 10_000, creditUsed: 0 });
    mocks.hotelUpdate.mockResolvedValue({});
    mocks.quoteUpdate.mockResolvedValue({ count: 1 });
    mocks.rfqUpdate.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      $queryRaw: vi.fn(),
      hotel: { findFirst: mocks.hotelFind, update: mocks.hotelUpdate },
      order: { create: mocks.orderCreate },
      procurementQuote: { updateMany: mocks.quoteUpdate },
      rfqRequest: { update: mocks.rfqUpdate },
    }));
  });

  it("creates a server-priced PO and leaves it awaiting the payment guarantee gate", async () => {
    const response = await POST(request({ deliveryInstructions: "Dock 2" }), { params: Promise.resolve({ id: "cquote1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ orderId: "corder1", status: "APPROVED", poLockState: "AWAITING_APPROVAL_AND_PAYMENT_GUARANTEE" });
    expect(mocks.orderCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        tenantId: "hotel-tenant",
        hotelId: "chotel01",
        supplierId: "csupplier",
        subtotal: 675,
        vatAmount: expect.closeTo(94.5, 4),
        total: 769.5,
        status: "DRAFT",
      }),
    }));
    expect(mocks.quoteUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "cquote1", status: "SUBMITTED" }, data: { status: "ACCEPTED" } }));
    expect(body.data).not.toHaveProperty("supplierId");
  });
});
