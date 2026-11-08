import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  consentFindFirst: vi.fn(),
  consentCreate: vi.fn(),
  consentUpdateMany: vi.fn(),
  opportunityFindMany: vi.fn(),
  opportunityFindFirst: vi.fn(),
  opportunityCreate: vi.fn(),
  opportunityUpdate: vi.fn(),
  auditLogCreate: vi.fn(),
  hasPermission: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ hasPermission: m.hasPermission }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: { findFirst: m.consentFindFirst, create: m.consentCreate, updateMany: m.consentUpdateMany },
    opportunity: { findMany: m.opportunityFindMany, findFirst: m.opportunityFindFirst, create: m.opportunityCreate, update: m.opportunityUpdate },
    auditLog: { create: m.auditLogCreate },
  },
}));

import { GET, POST } from "@/app/api/v2/ghost/route";
import { POST as decidePOST } from "@/app/api/v2/ghost/[findingId]/route";

function request(body?: unknown) {
  return new Request("https://hotelsvendors.com/api/v2/ghost", {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const actor = { id: "user-1", tenantId: "tenant-1", platformRole: "HOTEL_MANAGER" };

describe("Virtual Ghost — operational intelligence contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(actor);
    m.hasPermission.mockResolvedValue(true);
    m.consentFindFirst.mockResolvedValue({ id: "consent-1" });
    m.opportunityFindMany.mockResolvedValue([]);
    m.opportunityFindFirst.mockResolvedValue(null);
    m.opportunityCreate.mockResolvedValue({ id: "finding-1" });
    m.opportunityUpdate.mockResolvedValue({});
    m.auditLogCreate.mockResolvedValue({});
    m.consentCreate.mockResolvedValue({});
    m.consentUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("requires authentication", async () => {
    m.actor.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(m.consentFindFirst).not.toHaveBeenCalled();
  });

  it("reports opt-in state and withholds findings until the organization opts in", async () => {
    m.consentFindFirst.mockResolvedValue(null);
    const body = await (await GET()).json();
    expect(body.optedIn).toBe(false);
    expect(body.findings).toEqual([]);
    expect(m.opportunityFindMany).not.toHaveBeenCalled();
  });

  it("refuses evaluation when the organization has not opted in", async () => {
    m.consentFindFirst.mockResolvedValue(null);
    const response = await POST(request({ evaluate: true }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "GHOST_NOT_OPTED_IN" });
  });

  it("toggles opt-in through the consent record", async () => {
    m.consentFindFirst.mockResolvedValue(null);
    const body = await (await POST(request({ enabled: true }))).json();
    expect(body).toEqual({ optedIn: true });
    expect(m.consentCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ consentType: "GHOST_OPERATIONAL_INTELLIGENCE", status: "GRANTED" }),
    }));
    expect(m.auditLogCreate).toHaveBeenCalled();
  });

  it("withdraws opt-in instead of deleting the record", async () => {
    const body = await (await POST(request({ enabled: false }))).json();
    expect(body).toEqual({ optedIn: false });
    expect(m.consentUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "WITHDRAWN" }),
    }));
  });

  it("denies the decision endpoint without the required permission", async () => {
    m.hasPermission.mockResolvedValue(false);
    const response = await decidePOST(
      new Request("https://hotelsvendors.com/api/v2/ghost/finding-1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lifecycle: "ACCEPTED", reason: "Reviewed with the department" }),
      }),
      { params: Promise.resolve({ findingId: "finding-1" }) }
    );
    expect(response.status).toBe(403);
    expect(m.opportunityUpdate).not.toHaveBeenCalled();
  });

  it("accepts a finding WITHOUT approving expenditure or releasing an order", async () => {
    m.opportunityFindFirst.mockResolvedValue({
      id: "finding-1",
      title: "Shrinkage variance on towels",
      description: "Investigate",
      evidence: { category: "SHRINKAGE", evidence: [{ source: "InventoryReconciliation", recordId: "line-1", observation: "Variance 12 units" }], estimatedCost: { low: 96, high: 144, currency: "EGP", basis: "observed" } },
      confidence: 0.6,
      recommendedAction: "Investigate",
      verificationState: "PROPOSED",
      ownerId: null,
      createdAt: new Date("2026-11-08T00:00:00Z"),
    });
    const body = await (
      await decidePOST(
        new Request("https://hotelsvendors.com/api/v2/ghost/finding-1", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lifecycle: "ACCEPTED", reason: "Reviewed with the department" }),
        }),
        { params: Promise.resolve({ findingId: "finding-1" }) }
      )
    ).json();

    expect(body.expenditureApproved).toBe(false);
    expect(body.orderReleased).toBe(false);
    expect(body.finding.lifecycle).toBe("ACCEPTED");
    expect(body.finding.evidenceLabel).toBe("INFERENCE");
    expect(body.finding.disclaimer).toContain("NOT a verified fraud claim");
    expect(m.opportunityUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ verificationState: "ACCEPTED", status: "ACTION_READY" }),
    }));
    // The audit record must state that no expenditure was approved.
    expect(m.auditLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ changes: expect.objectContaining({ expenditureApproved: false, orderReleased: false }) }),
    }));
  });

  it("requires a meaningful reason for a decision", async () => {
    const response = await decidePOST(
      new Request("https://hotelsvendors.com/api/v2/ghost/finding-1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lifecycle: "DISMISSED", reason: "no" }),
      }),
      { params: Promise.resolve({ findingId: "finding-1" }) }
    );
    expect(response.status).toBe(400);
    expect(m.opportunityUpdate).not.toHaveBeenCalled();
  });

  it("lists findings with their evidence and estimated cost basis", async () => {
    m.opportunityFindMany.mockResolvedValue([
      {
        id: "finding-1",
        title: "Wastage variance",
        description: "Investigate",
        evidence: { category: "WASTAGE", evidence: [{ source: "InventoryReconciliation", recordId: "line-1", observation: "Waste 5 units" }], estimatedCost: { low: 40, high: 60, currency: "EGP", basis: "observed ±20%" }, disclaimer: "INFERENCE — evidence-backed observation; NOT a verified fraud claim." },
        confidence: 0.72,
        recommendedAction: "Investigate",
        verificationState: "PROPOSED",
        ownerId: null,
        createdAt: new Date("2026-11-08T00:00:00Z"),
        updatedAt: new Date("2026-11-08T00:00:00Z"),
      },
    ]);
    const body = await (await GET()).json();
    expect(body.findings).toHaveLength(1);
    expect(body.findings[0]).toMatchObject({
      category: "WASTAGE",
      evidenceLabel: "INFERENCE",
      lifecycle: "PROPOSED",
      estimatedCost: { currency: "EGP", basis: "observed ±20%" },
    });
    expect(body.findings[0].evidence[0]).toMatchObject({ source: "InventoryReconciliation", recordId: "line-1" });
  });
});
