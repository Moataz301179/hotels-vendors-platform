import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  product: vi.fn(),
  catalogItem: vi.fn(),
  findMany: vi.fn(),
  audit: vi.fn(),
  dispatch: vi.fn(),
  requirePermission: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    rfqRequest: {
      create: mocks.create,
      findMany: mocks.findMany,
    },
    product: { findFirst: mocks.product },
    catalogItem: { findFirst: mocks.catalogItem },
  },
}));

vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: (request: NextRequest) => unknown) => handler,
  authenticate: vi.fn(async () => ({ userId: "buyer-1", tenantId: "hotel-tenant", platformRole: "HOTEL" })),
  audit: mocks.audit,
  requirePermission: mocks.requirePermission,
  error: (message: string, status: number, details?: unknown) => Response.json({ success: false, error: message, details }, { status }),
  success: (data: unknown, status = 200) => Response.json({ success: true, data }, { status }),
}));

vi.mock("@/lib/audit/tamper-proof", () => ({
  appendAuditEntry: mocks.audit,
}));

vi.mock("@/lib/agents/swarm-orchestrator", () => ({
  swarm: { dispatch: mocks.dispatch },
}));

import { GET, POST, CreateRfqSchema } from "../../app/api/v1/rfq/route";

const createdRfq = {
  id: "rfq-1",
  status: "PENDING",
  matchingStatus: "QUEUED",
  requestedQty: 12,
  unitOfMeasure: "carton",
  itemName: "Butter 25kg",
  deliveryTimeline: "within 3 days",
  deliveryLocation: "Hurghada",
  estimatedResponse: "24 hours",
  createdAt: new Date("2026-10-09T10:00:00.000Z"),
};

const request = (body: unknown) => new NextRequest("http://localhost/api/v1/rfq", {
  method: "POST",
  body: JSON.stringify(body),
  headers: { "content-type": "application/json" },
});

describe("hotel sourcing request intake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dispatch.mockResolvedValue({ success: true });
    mocks.audit.mockResolvedValue(undefined);
    mocks.requirePermission.mockResolvedValue(undefined);
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      rfqRequest: { create: mocks.create },
    }));
    mocks.create.mockResolvedValue(createdRfq);
    delete process.env.PUBLIC_CATALOG_TENANT_ID;
  });

  it("accepts a free-text requirement when the catalogue has no match", () => {
    const parsed = CreateRfqSchema.safeParse({ itemName: "Pool chlorine", requestedQty: 6, unitOfMeasure: "drum" });
    expect(parsed.success).toBe(true);
  });

  it("rejects a request that mixes a supplier offer and market reference", () => {
    const parsed = CreateRfqSchema.safeParse({ productId: "supplier-product", catalogItemId: "market-item", requestedQty: 1 });
    expect(parsed.success).toBe(false);
  });

  it("creates a tenant-scoped RFQ without accepting or returning supplier identity", async () => {
    const response = await POST(request({
      itemName: "Pool chlorine",
      requestedQty: 6,
      unitOfMeasure: "drum",
      deliveryLocation: "Hurghada",
      // Deliberately supplied by a hostile browser; the API schema ignores it.
      supplierId: "unrelated-supplier",
    }));
    const body = await response.json();
    const createArgs = mocks.create.mock.calls[0][0];

    expect(response.status).toBe(201);
    expect(createArgs.data).toMatchObject({
      tenantId: "hotel-tenant",
      buyerId: "buyer-1",
      itemName: "Pool chlorine",
      supplierId: null,
      matchingStatus: "QUEUED",
    });
    expect(body.data.rfq.supplierIdentity).toBe("hidden_until_permitted_stage");
    expect(JSON.stringify(body)).not.toContain("unrelated-supplier");
    expect(mocks.dispatch).toHaveBeenCalledWith("rfq.submitted", expect.objectContaining({ tenantId: "hotel-tenant" }));
  });

  it("resolves a public market reference but still keeps supplier identity internal", async () => {
    process.env.PUBLIC_CATALOG_TENANT_ID = "public-catalog-tenant";
    mocks.catalogItem.mockResolvedValue({ id: "market-item", name: "Butter 25kg", category: "F_AND_B", unitOfMeasure: "carton" });

    const response = await POST(request({ catalogItemId: "market-item", requestedQty: 12 }));
    const createArgs = mocks.create.mock.calls[0][0];

    expect(response.status).toBe(201);
    expect(mocks.catalogItem).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: "public-catalog-tenant" }) }));
    expect(createArgs.data).toMatchObject({ catalogItemId: "market-item", productId: null, supplierId: null, itemName: "Butter 25kg" });
  });

  it("returns only the authenticated buyer's tenant-scoped status feed", async () => {
    mocks.findMany.mockResolvedValue([createdRfq]);
    const response = await GET(new NextRequest("http://localhost/api/v1/rfq?status=PENDING"));
    const body = await response.json();
    const query = mocks.findMany.mock.calls[0][0];

    expect(response.status).toBe(200);
    expect(query.where).toMatchObject({ tenantId: "hotel-tenant", buyerId: "buyer-1", status: "PENDING" });
    expect(body.data.rfqs[0].supplierIdentity).toBe("hidden_until_permitted_stage");
    expect(body.data.rfqs[0]).not.toHaveProperty("supplierId");
    expect(mocks.requirePermission).toHaveBeenCalledWith(expect.anything(), "rfq:read");
  });
});
