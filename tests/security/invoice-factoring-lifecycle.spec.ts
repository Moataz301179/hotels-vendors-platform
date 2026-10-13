import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  permission: vi.fn(),
  order: vi.fn(),
  user: vi.fn(),
  invoiceCreate: vi.fn(),
  invoiceFindFirst: vi.fn(),
  invoiceFindUnique: vi.fn(),
  factoringFind: vi.fn(),
  audit: vi.fn(),
  key: vi.fn(),
  complete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findFirst: mocks.order },
    user: { findFirst: mocks.user },
    invoice: { create: mocks.invoiceCreate, findFirst: mocks.invoiceFindFirst, findUnique: mocks.invoiceFindUnique },
    factoringRequest: { findFirst: mocks.factoringFind },
  },
}));
vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: (request: NextRequest, ctx?: unknown) => unknown) => handler,
  authenticate: mocks.auth,
  requirePermission: mocks.permission,
  validateBody: (schema: { parse: (value: unknown) => unknown }, body: unknown) => schema.parse(body),
  requireIdempotencyKey: mocks.key,
  completeIdempotency: mocks.complete,
  audit: mocks.audit,
  error: (message: string, status = 500) => Response.json({ success: false, error: message }, { status }),
  success: (data: unknown, status = 200) => Response.json({ success: true, data }, { status }),
}));
vi.mock("@/lib/fintech/factoring-bridge", () => ({ inquireAll: vi.fn(), submitFactoringInstruction: vi.fn() }));
vi.mock("@/lib/eta/validator", () => ({ validateForFactoring: vi.fn() }));
vi.mock("@/lib/fintech/risk-engine", () => ({ assessRisk: vi.fn() }));
vi.mock("@/lib/fintech/hub-revenue", () => ({ calculateHubRevenue: vi.fn() }));

import { POST as createInvoice } from "../../app/api/v1/invoices/route";
import { POST as requestFactoring } from "../../app/api/v1/invoices/[id]/factor/route";
import { POST as fundFactoring } from "../../app/api/v1/factoring/fund/route";

const auth = { userId: "csupusr1", tenantId: "hotel-tenant", platformRole: "SUPPLIER" };
const order = { id: "corder1", tenantId: "hotel-tenant", hotelId: "chotel01", supplierId: "csupplier", status: "DELIVERED", subtotal: 500, vatAmount: 70, total: 570, paymentGuaranteed: true, tripStops: [{ deliveryProofs: [{ id: "cproof1" }] }], goodsReceiptNotes: [{ status: "ACCEPTED" }] };
const invoice = { id: "cinvoice1", tenantId: "hotel-tenant", hotelId: "chotel01", supplierId: "csupplier", order, total: 570, dueDate: new Date(), etaUuid: "eta-1", etaStatus: "ACCEPTED", digitalSignature: "sig" };

function invoiceRequest(input: unknown) {
  return new NextRequest("https://hotelsvendors.com/api/v1/invoices", { method: "POST", headers: { "content-type": "application/json", "x-idempotency-key": "invoice-key-1" }, body: JSON.stringify(input) });
}

describe("invoice and factoring evidence gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(auth);
    mocks.permission.mockResolvedValue(undefined);
    mocks.order.mockResolvedValue(order);
    mocks.user.mockResolvedValue({ supplierId: "csupplier" });
    mocks.invoiceCreate.mockResolvedValue({ ...invoice, status: "DRAFT" });
    mocks.invoiceFindFirst.mockResolvedValue({ ...invoice, hotel: { taxId: "hotel-tax", name: "Hotel" }, supplier: { taxId: "supplier-tax", name: "Supplier" } });
    mocks.invoiceFindUnique.mockResolvedValue({ ...invoice, hotel: { taxId: "hotel-tax", name: "Hotel" }, supplier: { taxId: "supplier-tax", name: "Supplier" } });
    mocks.factoringFind.mockResolvedValue(null);
    mocks.audit.mockResolvedValue(undefined);
    mocks.key.mockResolvedValue("invoice-key-1");
  });

  it("derives invoice parties and totals from the order", async () => {
    const response = await createInvoice(invoiceRequest({ invoiceNumber: "INV-1", orderId: "corder1", hotelId: "chotel01", supplierId: "csupplier", subtotal: 500, vatRate: 14, vatAmount: 70, total: 570, issueDate: "2026-10-10T00:00:00.000Z" }));
    expect(response.status).toBe(201);
    expect(mocks.invoiceCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: "hotel-tenant", orderId: "corder1", hotelId: "chotel01", supplierId: "csupplier", subtotal: 500, vatAmount: 70, total: 570 }) }));
  });

  it("rejects invoice party substitution", async () => {
    const response = await createInvoice(invoiceRequest({ invoiceNumber: "INV-2", orderId: "corder1", hotelId: "cotherhotel", supplierId: "csupplier", subtotal: 500, vatRate: 14, vatAmount: 70, total: 570, issueDate: "2026-10-10T00:00:00.000Z" }));
    expect(response.status).toBe(400);
    expect(mocks.invoiceCreate).not.toHaveBeenCalled();
  });

  it("blocks factoring until delivery proof and GRN exist", async () => {
    mocks.invoiceFindFirst.mockResolvedValue({ ...invoice, order: { ...order, tripStops: [{ deliveryProofs: [] }] }, hotel: { taxId: "hotel-tax", name: "Hotel" }, supplier: { taxId: "supplier-tax", name: "Supplier" } });
    const response = await requestFactoring(new NextRequest("https://hotelsvendors.com/api/v1/invoices/cinvoice1/factor", { method: "POST", headers: { "x-idempotency-key": "factor-key-1" } }), { params: Promise.resolve({ id: "cinvoice1" }) });
    expect(response.status).toBe(409);
    expect(mocks.factoringFind).not.toHaveBeenCalled();
  });

  it("does not allow the funding instruction to bypass an accepted factoring offer", async () => {
    mocks.invoiceFindFirst.mockResolvedValue({ ...invoice, factoringStatus: "OFFERED", factoringCompanyId: "cfunder1", hotel: { taxId: "hotel-tax", name: "Hotel" }, supplier: { taxId: "supplier-tax", name: "Supplier" } });
    const response = await fundFactoring(new NextRequest("https://hotelsvendors.com/api/v1/factoring/fund", {
      method: "POST",
      headers: { "content-type": "application/json", "x-idempotency-key": "fund-key-1" },
      body: JSON.stringify({ invoiceId: "cinvoice1", partnerId: "cfunder1" }),
    }));
    expect(response.status).toBe(409);
    expect(mocks.factoringFind).not.toHaveBeenCalled();
  });
});
