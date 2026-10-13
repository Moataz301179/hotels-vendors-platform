import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), grants: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: mocks.account }, rolePermission: { findMany: mocks.grants } } }));
import { getUserPermissions, requirePermission } from "@/lib/auth/rbac";
const ctx = { userId: "u1", tenantId: "t1", platformRole: "HOTEL" };
describe("database role authorization", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("denies cross-tenant assigned roles and never reads their grants", async () => {
    mocks.account.mockResolvedValue({ assignedRole: { id: "r1", tenantId: "t2", isGlobal: false, deletedAt: null }, tenant: { type: "HOTEL_GROUP" } });
    expect(await getUserPermissions(ctx)).toEqual([]);
    expect(mocks.grants).not.toHaveBeenCalled();
  });
  it("does not grant blanket access from an ADMIN claim", async () => {
    mocks.account.mockResolvedValue(null);
    await expect(requirePermission({ ...ctx, platformRole: "ADMIN" }, "admin:read")).rejects.toThrow("Missing permission");
  });
  it("requires a platform tenant for a global admin role", async () => {
    mocks.account.mockResolvedValue({ assignedRole: { id: "r1", isGlobal: true, deletedAt: null }, tenant: { type: "HOTEL_GROUP" } });
    expect(await getUserPermissions({ ...ctx, platformRole: "ADMIN" })).toEqual([]);
  });
  it("returns only active permission grants for the actual tenant role", async () => {
    mocks.account.mockResolvedValue({ platformRole: "HOTEL", assignedRole: { id: "r1", tenantId: "t1", isGlobal: false, deletedAt: null }, tenant: { type: "HOTEL_GROUP" } });
    mocks.grants.mockResolvedValue([{ permission: { code: "order:read" } }]);
    await expect(requirePermission(ctx, "order:read")).resolves.toBeUndefined();
    expect(mocks.account.mock.calls[0][0].where).toMatchObject({ tenantId: "t1", deletedAt: null, status: "ACTIVE" });
    expect(mocks.grants.mock.calls[0][0].where).toMatchObject({ deletedAt: null, permission: { deletedAt: null } });
  });
});
