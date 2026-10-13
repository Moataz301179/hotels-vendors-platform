import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  permission: vi.fn(),
  user: vi.fn(),
  rfq: vi.fn(),
  rfqUpdate: vi.fn(),
  product: vi.fn(),
  supplier: vi.fn(),
  quoteFind: vi.fn(),
  quoteCreate: vi.fn(),
  quoteMany: vi.fn(),
  transaction: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mocks.user },
    rfqRequest: { findFirst: mocks.rfq, update: mocks.rfqUpdate },
    product: { findFirst: mocks.product },
    supplier: { findFirst: mocks.supplier },
    procurementQuote: { findFirst: mocks.quoteFind, findMany: mocks.quoteMany },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: (request: NextRequest) => unknown) => handler,
  authenticate: mocks.auth,
  requirePermission: mocks.permission,
  error: (message: string, status = 500, details?: unknown) => Response.json({ success: false, error: message, details }, { status }),
  success: (data: unknown, status = 200) => Response.json({ success: true, data }, { status }),
  audit: mocks.audit,
}));

import { POST, GET } from "../../app/api/v1/rfq/quotes/route";

const supplierAuth = { userId: "csupusr1", tenantId: "supplier-tenant", platformRole: "SUPPLIER" };
const buyerAuth = { userId: "cbuyer01", tenantId: "hotel-tenant", platformRole: "HOTEL" };
const rfq = { id: "crfq001", tenantId: "hotel-tenant", buyerId: "cbuyer01", productId: "cprod01", supplierId: null, requestedQty: 5, status: "PENDING" };
const quote = { id: "cquote1", unitPrice: 125, quantity: 5, currency: "EGP", leadTimeDays: 2, deliveryFee: 50, validUntil: null, notes: "Available this week", status: "SUBMITTED", submittedAt: new Date("2026-10-10T00:00:00.000Z") };

function request(body: unknown) {
  return new NextRequest("https://hotelsvendors.com/api/v1/rfq/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

describe("RFQ quote comparison and supplier mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(supplierAuth);
    mocks.permission.mockResolvedValue(undefined);
    mocks.user.mockResolvedValue({ supplierId: "csupplier" });
    mocks.rfq.mockResolvedValue(structuredClone(rfq));
    mocks.product.mockResolvedValue({ id: "cprod01" });
    mocks.supplier.mockResolvedValue({ id: "csupplier" });
    mocks.quoteFind.mockResolvedValue(null);
    mocks.quoteCreate.mockResolvedValue(quote);
    mocks.rfqUpdate.mockResolvedValue({});
    mocks.audit.mockResolvedValue(undefined);
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      $queryRaw: vi.fn(),
      procurementQuote: { create: mocks.quoteCreate, findFirst: mocks.quoteFind },
      rfqRequest: { update: mocks.rfqUpdate },
    }));
  });

  it("accepts only a mapped supplier response and hides supplier identity", async () => {
    const response = await POST(request({ rfqId: "crfq001", unitPrice: 125, quantity: 5, leadTimeDays: 2, deliveryFee: 50, notes: "Available this week" }));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(mocks.quoteCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ rfqId: "crfq001", tenantId: "hotel-tenant", supplierId: "csupplier", buyerId: "cbuyer01", status: "SUBMITTED" }) }));
    expect(body.data.quote.supplierIdentity).toBe("hidden_until_order_execution");
    expect(JSON.stringify(body)).not.toContain("csupplier");
  });

  it("rejects a supplier that is not matched to the RFQ product", async () => {
    mocks.product.mockResolvedValue(null);
    const response = await POST(request({ rfqId: "crfq001", unitPrice: 125, quantity: 5 }));
    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns buyer comparison data without supplier identifiers", async () => {
    mocks.auth.mockResolvedValue(buyerAuth);
    mocks.user.mockResolvedValue(null);
    mocks.rfq.mockResolvedValue({ id: "crfq001" });
    mocks.quoteMany.mockResolvedValue([quote]);
    const response = await GET(new NextRequest("https://hotelsvendors.com/api/v1/rfq/quotes?rfqId=crfq001"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.quotes[0]).toMatchObject({ unitPrice: 125, quantity: 5, supplierIdentity: "hidden_until_order_execution" });
    expect(body.data.quotes[0]).not.toHaveProperty("supplierId");
    expect(mocks.quoteMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ rfqId: "crfq001", tenantId: "hotel-tenant" }) }));
  });
});
