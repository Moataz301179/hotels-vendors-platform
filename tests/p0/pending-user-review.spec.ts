import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ actor: vi.fn(), users: vi.fn(), user: vi.fn(), userUpdate: vi.fn(), tenant: vi.fn(), tenantUpdate: vi.fn(), supplierUpdate: vi.fn(), carrierUpdate: vi.fn(), authorityFind: vi.fn(), authorityCreate: vi.fn(), permissionUpsert: vi.fn(), rolePermissionUpsert: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findMany: m.users, findFirst: m.user }, tenant: { findFirst: m.tenant }, $transaction: m.transaction } }));

import { GET, PATCH } from "@/app/api/v2/admin/pending-users/route";

const admin = { id: "platform-admin", tenantId: "platform-tenant", platformRole: "ADMIN" };
const approval = () => new Request("https://hotelsvendors.com/api/v2/admin/pending-users", {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ userId: "supplier-user", decision: "APPROVE", reviewNote: "Supplier organization documents were verified." }),
});

describe("platform review of pending workspaces", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(admin);
    m.users.mockResolvedValue([{ id: "supplier-user", tenantId: "supplier-tenant", platformRole: "SUPPLIER" }]);
    m.user.mockResolvedValue({ id: "supplier-user", tenantId: "supplier-tenant", status: "PENDING_VERIFICATION", platformRole: "SUPPLIER" });
    m.tenant.mockResolvedValue({ id: "supplier-tenant", taxId: "EG-123" });
    m.userUpdate.mockResolvedValue({ id: "supplier-user", status: "ACTIVE" });
    m.audit.mockResolvedValue(undefined);
    m.permissionUpsert.mockResolvedValue({ id: 'permission' });
    m.authorityFind.mockResolvedValue(null);
    m.authorityCreate.mockResolvedValue({ id: 'authority' });
    m.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({ user: { update: m.userUpdate }, tenant: { update: m.tenantUpdate }, supplier: { updateMany: m.supplierUpdate }, carrierProfile: { updateMany: m.carrierUpdate }, authorityRule: { findFirst: m.authorityFind, create: m.authorityCreate }, permission: { upsert: m.permissionUpsert }, rolePermission: { upsert: m.rolePermissionUpsert } }));
  });

  it("lists pending supplier workspaces outside the platform administrator tenant", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(m.users.mock.calls[0][0].where).toEqual({ status: "PENDING_VERIFICATION", deletedAt: null });
  });

  it("approves a cross-tenant pending workspace and audits the target tenant", async () => {
    const response = await PATCH(approval());

    expect(response.status).toBe(200);
    expect(m.user.mock.calls[0][0].where).toEqual({ id: "supplier-user", status: "PENDING_VERIFICATION", deletedAt: null });
    expect(m.userUpdate).toHaveBeenCalledWith({ where: { id: "supplier-user" }, data: { status: "ACTIVE" } });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "supplier-tenant", entityId: "supplier-user" }), expect.anything());
    expect(m.supplierUpdate).not.toHaveBeenCalled();
  });

  it("opens supplier commercial access only when the reviewer checks the tax identity", async () => {
    m.user.mockResolvedValue({ id: "supplier-user", tenantId: "supplier-tenant", status: "PENDING_VERIFICATION", platformRole: "SUPPLIER", role: "OWNER", roleId: "supplier-role", supplierId: "supplier-record" });
    const response = await PATCH(new Request("https://hotelsvendors.com/api/v2/admin/pending-users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "supplier-user", decision: "APPROVE", taxVerification: "VERIFY", reviewNote: "Supplier tax identity was checked." }),
    }));

    expect(response.status).toBe(200);
    expect(m.supplierUpdate).toHaveBeenCalledWith({ where: { id: "supplier-record", tenantId: "supplier-tenant", deletedAt: null }, data: { isVerified: true } });
  });

  it("gives an approved hotel founder owner authority", async () => {
    m.user.mockResolvedValue({ id: "hotel-user", tenantId: "hotel-tenant", status: "PENDING_VERIFICATION", platformRole: "HOTEL", role: "DEPARTMENT_HEAD", roleId: "hotel-role", supplierId: null });
    const response = await PATCH(new Request("https://hotelsvendors.com/api/v2/admin/pending-users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "hotel-user", decision: "APPROVE", taxVerification: "VERIFY", reviewNote: "Hotel tax identity was checked." }),
    }));

    expect(response.status).toBe(200);
    expect(m.userUpdate).toHaveBeenCalledWith({ where: { id: "hotel-user" }, data: { role: "OWNER" } });
    expect(m.authorityCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: "hotel-tenant", role: "OWNER", action: "APPROVE" }) }));
    expect(m.permissionUpsert).toHaveBeenCalledWith(expect.objectContaining({ where: { code: "order:approve" } }));
  });

  it("verifies a carrier profile when the registration is approved", async () => {
    m.user.mockResolvedValue({ id: "carrier-user", tenantId: "carrier-tenant", status: "PENDING_VERIFICATION", platformRole: "SHIPPING", role: "LOGISTICS_COORDINATOR", roleId: "carrier-role", supplierId: null });
    const response = await PATCH(new Request("https://hotelsvendors.com/api/v2/admin/pending-users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "carrier-user", decision: "APPROVE", reviewNote: "Carrier operating identity was checked." }),
    }));

    expect(response.status).toBe(200);
    expect(m.carrierUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "carrier-user", tenantId: "carrier-tenant", deletedAt: null }, data: expect.objectContaining({ status: "VERIFIED", verifiedBy: "platform-admin" }) }));
  });
});
