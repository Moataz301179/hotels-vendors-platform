import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  findUser: vi.fn(),
  findPerm: vi.fn(),
  upsert: vi.fn(),
  transaction: vi.fn(),
  audit: vi.fn(),
  managed: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/admin/managed-hotel-tenants", () => ({ managedHotelTenant: m.managed }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: m.findUser },
    permission: { findFirst: m.findPerm },
    userPermissionGrant: { upsert: m.upsert },
    $transaction: m.transaction,
  },
}));

import { POST } from "@/app/api/v2/admin/user-permissions/route";

const platformAdmin = { id: "admin-1", tenantId: "platform-tenant", platformRole: "ADMIN" };

function grantRequest(body: unknown) {
  return new Request("https://hotelsvendors.com/api/v2/admin/user-permissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("user-permissions: unauthorized role escalation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.transaction.mockImplementation(async (fn: unknown) => {
      if (typeof fn === "function") return fn({ userPermissionGrant: { upsert: m.upsert } });
      return null;
    });
  });

  it("rejects a non-ADMIN actor from granting permissions", async () => {
    m.actor.mockResolvedValue({ id: "admin-1", tenantId: "hotel-tenant", platformRole: "HOTEL" });
    const res = await POST(grantRequest({
      tenantId: "hotel-tenant", userId: "user-1", permissionCode: "order:create",
    }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("ADMIN_ROLE_REQUIRED");
    expect(m.upsert).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it("rejects cross-tenant permission grants even for ADMIN", async () => {
    m.actor.mockResolvedValue(platformAdmin);
    m.managed.mockResolvedValue(null);
    const res = await POST(grantRequest({
      tenantId: "other-tenant", userId: "user-1", permissionCode: "order:create",
    }));
    expect(res.status).toBe(404);
  });

  it("prevents self-escalation to unknown permission codes", async () => {
    m.actor.mockResolvedValue({ id: "admin-1", tenantId: "hotel-tenant", platformRole: "HOTEL" });
    const res = await POST(grantRequest({
      tenantId: "hotel-tenant", userId: "admin-1", permissionCode: "admin:create",
    }));
    // admin:create is not in the permission registry — rejected at the boundary
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("UNKNOWN_PERMISSION_CODE");
  });

  it("prevents self-escalation to admin-only permission codes", async () => {
    m.actor.mockResolvedValue({ id: "admin-1", tenantId: "hotel-tenant", platformRole: "HOTEL" });
    const res = await POST(grantRequest({
      tenantId: "hotel-tenant", userId: "admin-1", permissionCode: "audit:read",
    }));
    // Non-ADMIN actor blocked at the authorization gate (requireAdmin)
    // before the permission-level check (requiresAdmin) is evaluated.
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("ADMIN_ROLE_REQUIRED");
  });

  it("allows ADMIN to grant non-admin permissions to managed hotel tenants", async () => {
    m.actor.mockResolvedValue(platformAdmin);
    m.managed.mockResolvedValue({ id: "hotel-tenant" });
    m.findUser.mockResolvedValue({ id: "user-1" });
    m.findPerm.mockResolvedValue({ id: "perm-1", code: "order:create" });
    m.upsert.mockResolvedValue({ id: "grant-1" });
    const res = await POST(grantRequest({
      tenantId: "hotel-tenant", userId: "user-1", permissionCode: "order:create",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.grant).toBeTruthy();
    expect(m.audit).toHaveBeenCalled();
    const auditArgs = m.audit.mock.calls[0][0];
    expect(auditArgs.actionType).toBe("UPDATED");
    expect(auditArgs.actorRole).toBe("ADMIN");
  });
});