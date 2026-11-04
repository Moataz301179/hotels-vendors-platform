import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  requestFindMany: vi.fn(),
  requestFindFirst: vi.fn(),
  requestCreate: vi.fn(),
  requestUpdateMany: vi.fn(),
  companyFindMany: vi.fn(),
  companyFindFirst: vi.fn(),
  invoiceFindFirst: vi.fn(),
  invoiceUpdate: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/prisma", () => {
  const tx = {
    factoringRequest: { create: m.requestCreate, updateMany: m.requestUpdateMany },
    invoice: { update: m.invoiceUpdate },
  };
  return {
    prisma: {
      factoringRequest: { findMany: m.requestFindMany, findFirst: m.requestFindFirst },
      factoringCompany: { findMany: m.companyFindMany, findFirst: m.companyFindFirst },
      invoice: { findFirst: m.invoiceFindFirst },
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    },
  };
});

import { PATCH, POST } from "@/app/api/v2/funding/route";

function request(method: "POST" | "PATCH", body: unknown, key = "funding-referral-001") {
  return new Request("https://hotelsvendors.test/api/v2/funding", {
    method,
    headers: { "content-type": "application/json", "idempotency-key": key },
    body: JSON.stringify(body),
  });
}

describe("provider-controlled funding referral lifecycle", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.requestFindFirst.mockResolvedValue(null);
    m.invoiceFindFirst.mockResolvedValue({ id: "invoice-1", tenantId: "hotel-tenant", total: 1000, factoringRequests: null });
    m.companyFindFirst.mockResolvedValue({ id: "funder-1" });
    m.requestCreate.mockResolvedValue({ id: "referral-1", status: "PENDING" });
    m.requestUpdateMany.mockResolvedValue({ count: 1 });
    m.invoiceUpdate.mockResolvedValue({ id: "invoice-1" });
    m.audit.mockResolvedValue("audit-1");
  });

  it("persists a verified supplier referral without moving funds", async () => {
    m.actor.mockResolvedValue({ id: "supplier-user", tenantId: "supplier-tenant", supplierId: "supplier-1", platformRole: "SUPPLIER" });
    const response = await POST(request("POST", { invoiceId: "invoice-1", factoringCompanyId: "funder-1", requestedAmount: 800 }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ moneyMoved: false, referral: { id: "referral-1", status: "PENDING" } });
    expect(m.requestCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      invoiceId: "invoice-1",
      factoringCompanyId: "funder-1",
      tenantId: "hotel-tenant",
      requestedAmount: 800,
      referralIdempotencyKey: "funding-referral-001",
      status: "PENDING",
    }) });
    expect(m.invoiceUpdate).toHaveBeenCalledWith({ where: { id: "invoice-1" }, data: { factoringStatus: "OFFERED", factoringCompanyId: "funder-1" } });
  });

  it("returns the original referral for an identical idempotent replay", async () => {
    m.actor.mockResolvedValue({ id: "supplier-user", tenantId: "supplier-tenant", supplierId: "supplier-1", platformRole: "SUPPLIER" });
    m.requestFindFirst.mockResolvedValue({ id: "referral-1", invoiceId: "invoice-1", factoringCompanyId: "funder-1", status: "PENDING" });
    const response = await POST(request("POST", { invoiceId: "invoice-1", factoringCompanyId: "funder-1" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ idempotentReplay: true, moneyMoved: false });
    expect(m.requestCreate).not.toHaveBeenCalled();
  });

  it("rejects an idempotency key reused for another referral", async () => {
    m.actor.mockResolvedValue({ id: "supplier-user", tenantId: "supplier-tenant", supplierId: "supplier-1", platformRole: "SUPPLIER" });
    m.requestFindFirst.mockResolvedValue({ id: "referral-1", invoiceId: "another-invoice", factoringCompanyId: "funder-1" });
    const response = await POST(request("POST", { invoiceId: "invoice-1", factoringCompanyId: "funder-1" }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "IDEMPOTENCY_KEY_CONFLICT" });
  });

  it("allows only the assigned funder to record a valid next state", async () => {
    m.actor.mockResolvedValue({ id: "funder-user", tenantId: "funder-tenant", factoringCompanyId: "funder-1", platformRole: "FACTORING" });
    m.requestFindFirst.mockResolvedValue({ id: "referral-1", tenantId: "supplier-tenant", factoringCompanyId: "funder-1", status: "PENDING", partnerResponse: null });
    const response = await PATCH(request("PATCH", { id: "referral-1", status: "UNDER_REVIEW" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ updated: true, status: "UNDER_REVIEW", moneyMoved: false });
    expect(m.requestUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "referral-1", factoringCompanyId: "funder-1", status: "PENDING" }),
      data: expect.objectContaining({ status: "UNDER_REVIEW" }),
    }));
  });

  it("rejects skipped transitions and provider settlement claims without a reference", async () => {
    m.actor.mockResolvedValue({ id: "funder-user", tenantId: "funder-tenant", factoringCompanyId: "funder-1", platformRole: "FACTORING" });
    m.requestFindFirst.mockResolvedValueOnce({ id: "referral-1", tenantId: "supplier-tenant", factoringCompanyId: "funder-1", status: "PENDING", partnerResponse: null });
    const skipped = await PATCH(request("PATCH", { id: "referral-1", status: "DISBURSED", externalReference: "provider-1" }));
    expect(skipped.status).toBe(409);

    m.requestFindFirst.mockResolvedValueOnce({ id: "referral-1", tenantId: "supplier-tenant", factoringCompanyId: "funder-1", status: "APPROVED", partnerResponse: null });
    const missingReference = await PATCH(request("PATCH", { id: "referral-1", status: "DISBURSED" }));
    expect(missingReference.status).toBe(400);
    expect(m.requestUpdateMany).not.toHaveBeenCalled();
  });

  it("never lets a hotel or supplier record a funder decision", async () => {
    m.actor.mockResolvedValue({ id: "supplier-user", tenantId: "supplier-tenant", supplierId: "supplier-1", platformRole: "SUPPLIER" });
    const response = await PATCH(request("PATCH", { id: "referral-1", status: "APPROVED" }));
    expect(response.status).toBe(403);
    expect(m.requestFindFirst).not.toHaveBeenCalled();
  });
});
