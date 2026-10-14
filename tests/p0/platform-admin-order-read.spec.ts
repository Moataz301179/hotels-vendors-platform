import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), tenants: vi.fn(), orders: vi.fn() }));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/admin/managed-hotel-tenants", () => ({ managedHotelTenants: m.tenants }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: vi.fn() }));
vi.mock("@/lib/auth/v2-authority", () => ({ evaluateV2Authority: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findMany: m.orders } } }));

import { GET } from "@/app/api/v2/orders/route";

describe("platform-admin order review", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "platform-admin", tenantId: "platform-tenant", platformRole: "ADMIN", role: "OWNER" });
    m.permission.mockResolvedValue(undefined);
    m.tenants.mockResolvedValue([{ id: "hotel-tenant", name: "Cairo Hotel Group" }]);
    m.orders.mockResolvedValue([]);
  });

  it("lists a selected active hotel organization's orders for payment guarantee review", async () => {
    const response = await GET(new Request("https://hotelsvendors.com/api/v2/orders?tenantId=hotel-tenant"));

    expect(response.status).toBe(200);
    expect(m.orders).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "hotel-tenant", deletedAt: null } }));
    expect(await response.json()).toMatchObject({ tenants: [{ id: "hotel-tenant", name: "Cairo Hotel Group" }] });
  });
});
