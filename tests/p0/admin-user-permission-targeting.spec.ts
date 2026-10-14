import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ actor: vi.fn(), tenants: vi.fn(), tenant: vi.fn(), grants: vi.fn(), users: vi.fn(), user: vi.fn(), permission: vi.fn(), upsert: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/admin/managed-hotel-tenants", () => ({ managedHotelTenants: m.tenants, managedHotelTenant: m.tenant }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/prisma", () => ({ prisma: { userPermissionGrant: { findMany: m.grants, upsert: m.upsert }, user: { findMany: m.users, findFirst: m.user }, permission: { findFirst: m.permission }, $transaction: m.transaction } }));

import { GET, POST } from "@/app/api/v2/admin/user-permissions/route";

const actor = { id: "platform-admin", tenantId: "platform-tenant", platformRole: "ADMIN", role: "OWNER" };
const request = (body: unknown) => new Request("https://hotelsvendors.com/api/v2/admin/user-permissions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("hotel organization permission grants", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(actor);
    m.tenants.mockResolvedValue([{ id: "hotel-tenant", name: "Cairo Hotel Group" }]);
    m.tenant.mockResolvedValue({ id: "hotel-tenant", name: "Cairo Hotel Group" });
    m.grants.mockResolvedValue([]);
    m.users.mockResolvedValue([{ id: "hotel-owner", name: "Hotel Owner", email: "owner@example.test", role: "OWNER" }]);
    m.user.mockResolvedValue({ id: "hotel-owner" });
    m.permission.mockResolvedValue({ id: "approve-permission", code: "order:approve" });
    m.upsert.mockResolvedValue({ id: "grant-1", tenantId: "hotel-tenant", userId: "hotel-owner" });
    m.audit.mockResolvedValue(undefined);
    m.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({ userPermissionGrant: { upsert: m.upsert } }));
  });

  it("lists grants and active hotel members only for the selected hotel organization", async () => {
    const response = await GET(new Request("https://hotelsvendors.com/api/v2/admin/user-permissions?tenantId=hotel-tenant"));

    expect(response.status).toBe(200);
    expect(m.grants).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "hotel-tenant" } }));
    expect(m.users).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "hotel-tenant", status: "ACTIVE", deletedAt: null } }));
  });

  it("grants order approval to a selected hotel member and audits that hotel tenant", async () => {
    const response = await POST(request({ tenantId: "hotel-tenant", userId: "hotel-owner", permissionCode: "order:approve" }));

    expect(response.status).toBe(201);
    expect(m.user).toHaveBeenCalledWith({ where: { id: "hotel-owner", tenantId: "hotel-tenant", status: "ACTIVE", deletedAt: null }, select: { id: true } });
    expect(m.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId_userId_permissionId: { tenantId: "hotel-tenant", userId: "hotel-owner", permissionId: "approve-permission" } } }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "hotel-tenant", changes: expect.objectContaining({ delegatedPermission: "order:approve" }) }), expect.anything());
  });

  it("does not grant access when the selected hotel organization is unavailable", async () => {
    m.tenant.mockResolvedValue(null);

    const response = await POST(request({ tenantId: "other-tenant", userId: "hotel-owner", permissionCode: "order:approve" }));

    expect(response.status).toBe(404);
    expect(m.upsert).not.toHaveBeenCalled();
  });
});
