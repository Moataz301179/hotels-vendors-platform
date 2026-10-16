import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  tenantUpdate: vi.fn(),
  hotelFind: vi.fn(),
  hotelCreate: vi.fn(),
  userUpdate: vi.fn(),
  progressUpsert: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  tenant: { update: m.tenantUpdate },
  hotel: { findFirst: m.hotelFind, create: m.hotelCreate },
  user: { update: m.userUpdate },
  onboardingProgress: { upsert: m.progressUpsert },
  $transaction: m.transaction,
} }));

import { POST } from "@/app/api/v2/onboarding/route";

describe("hotel onboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "hotel-user", tenantId: "hotel-tenant", platformRole: "HOTEL", email: "buyer@example.test", status: "PENDING_VERIFICATION" });
    m.hotelFind.mockResolvedValue(null);
    m.hotelCreate.mockResolvedValue({ id: "hotel-record" });
    m.progressUpsert.mockResolvedValue({ id: "progress-record" });
    m.transaction.mockImplementation((callback) => callback({
      tenant: { update: m.tenantUpdate },
      hotel: { create: m.hotelCreate },
      user: { update: m.userUpdate },
      onboardingProgress: { upsert: m.progressUpsert },
    }));
  });

  it("links the onboarding member to the hotel record it creates", async () => {
    const response = await POST(new Request("https://hotelsvendors.test/api/v2/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Example Hotel", taxId: "EG-123", city: "Cairo", governorate: "Cairo" }),
    }));

    expect(response.status).toBe(201);
    expect(m.hotelCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: "hotel-tenant", taxId: "EG-123" }) }));
    expect(m.userUpdate).toHaveBeenCalledWith({ where: { id: "hotel-user" }, data: { hotelId: "hotel-record" } });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: "ONBOARDING", entityId: "hotel-record", tenantId: "hotel-tenant" }), expect.anything());
  });

  it("returns a controlled conflict when the tax ID or contact identity is already registered", async () => {
    m.transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test" }));
    const response = await POST(new Request("https://hotelsvendors.test/api/v2/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Example Hotel", taxId: "EG-123", city: "Cairo", governorate: "Cairo" }),
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "An organization with this tax ID or contact identity already exists." });
  });
});
