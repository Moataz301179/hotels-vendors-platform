import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ actor: vi.fn(), managed: vi.fn(), user: vi.fn(), role: vi.fn(), update: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/admin/managed-hotel-tenants", () => ({ managedHotelTenant: m.managed }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: m.user }, role: { upsert: m.role }, $transaction: m.transaction } }));

import { POST } from "@/app/api/v2/admin/members/route";

const request = (body: unknown) => new Request("https://hotelsvendors.com/api/v2/admin/members", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("hotel organization member provisioning", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "admin", tenantId: "platform", platformRole: "ADMIN" });
    m.managed.mockResolvedValue({ id: "hotel-tenant" });
    m.user.mockResolvedValue({ id: "new-member", email: "member@hotel.test", tenantId: "pending-tenant", platformRole: "HOTEL", status: "PENDING_VERIFICATION", hotelId: null, supplierId: null });
    m.role.mockResolvedValue({ id: "hotel-member-role" });
    m.update.mockResolvedValue({ id: "new-member", email: "member@hotel.test", role: "CLERK", tenantId: "hotel-tenant" });
    m.audit.mockResolvedValue(undefined);
    m.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({ user: { update: m.update } }));
  });

  it("activates a signed-in pending hotel user only in the administrator-selected hotel tenant and audits it", async () => {
    const response = await POST(request({ tenantId: "hotel-tenant", email: "MEMBER@HOTEL.TEST", role: "CLERK" }));
    expect(response.status).toBe(201);
    expect(m.user).toHaveBeenCalledWith({ where: { email: "member@hotel.test", deletedAt: null }, select: expect.any(Object) });
    expect(m.update).toHaveBeenCalledWith({ where: { id: "new-member" }, data: { tenantId: "hotel-tenant", roleId: "hotel-member-role", role: "CLERK", status: "ACTIVE" } });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "hotel-tenant", changes: expect.objectContaining({ organizationMembership: expect.objectContaining({ fromTenantId: "pending-tenant", toTenantId: "hotel-tenant" }) }) }), expect.anything());
  });

  it("does not move a user who already owns an active hotel or supplier workspace", async () => {
    m.user.mockResolvedValue({ id: "owner", email: "owner@hotel.test", tenantId: "other", platformRole: "HOTEL", hotelId: "hotel-profile", supplierId: null });
    const response = await POST(request({ tenantId: "hotel-tenant", email: "owner@hotel.test", role: "GM" }));
    expect(response.status).toBe(409);
    expect(m.update).not.toHaveBeenCalled();
  });

  it("rejects a caller without the platform administrator role", async () => {
    m.actor.mockResolvedValue({ id: "hotel-user", tenantId: "hotel-tenant", platformRole: "HOTEL" });
    const response = await POST(request({ tenantId: "hotel-tenant", email: "member@hotel.test", role: "CLERK" }));
    expect(response.status).toBe(403);
    expect(m.managed).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
  });

  it("requires the member to have signed in before an administrator can assign the organization", async () => {
    m.user.mockResolvedValue(null);
    const response = await POST(request({ tenantId: "hotel-tenant", email: "new@hotel.test", role: "CLERK" }));
    expect(response.status).toBe(404);
    expect(m.update).not.toHaveBeenCalled();
  });
});
