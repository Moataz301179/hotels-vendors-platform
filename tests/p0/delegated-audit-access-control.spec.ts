import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  permission: vi.fn(),
  users: vi.fn(),
  audit: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/audit/tamper-proof", () => ({ verifyTenantAuditRecords: m.verify }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findMany: m.users }, auditLog: { findMany: m.audit } } }));

import { GET } from "@/app/api/v2/audit/delegated/route";

const ownActor = { id: "owner-a", tenantId: "tenant-a", platformRole: "OWNER" };
const otherActor = { id: "owner-b", tenantId: "tenant-b", platformRole: "OWNER" };
const clerkActor = { id: "clerk-a", tenantId: "tenant-a", platformRole: "CLERK" };

function request(q: string | null = null) {
  const url = q
    ? `https://hotelsvendors.com/api/v2/audit/delegated?q=${encodeURIComponent(q)}`
    : "https://hotelsvendors.com/api/v2/audit/delegated";
  return new Request(url);
}

describe("delegated-team audit access control", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.users.mockResolvedValue([{ id: "u1", email: "a@example.com", name: "Owner A", role: "OWNER", status: "ACTIVE" }]);
    m.audit.mockResolvedValue([]);
    m.verify.mockResolvedValue({ valid: true, totalEntries: 0 });
  });

  it("rejects unauthenticated callers", async () => {
    m.actor.mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(m.permission).not.toHaveBeenCalled();
    expect(m.users).not.toHaveBeenCalled();
  });

  it("rejects callers without audit:read before any tenant query", async () => {
    m.actor.mockResolvedValue(ownActor);
    m.permission.mockRejectedValue(new PermissionDeniedError("denied"));
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "AUDIT_READ_PERMISSION_REQUIRED" });
    expect(m.users).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it("returns only the caller's own members and actions", async () => {
    m.actor.mockResolvedValue(ownActor);
    m.permission.mockResolvedValue(undefined);
    m.users.mockResolvedValue([{ id: "u1", email: "a@example.com", name: "Owner A", role: "OWNER", status: "ACTIVE" }]);
    m.audit.mockResolvedValue([
      { id: "entry-1", createdAt: new Date().toISOString(), entityName: "ORDER", entityId: "order-1", actionType: "CREATED", actorId: "u1", actorRole: "OWNER", hash: "abc" },
    ]);
    const response = await GET(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.tenantId).toBe("tenant-a");
    expect(body.members).toHaveLength(1);
    expect(body.members[0].email).toBe("a@example.com");
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0].id).toBe("entry-1");
    expect(body.entries[0].entityName).toBe("ORDER");
    expect(body.entries[0].entityId).toBe("order-1");
    expect(body.entries[0].actionType).toBe("CREATED");
    expect(body.entries[0].actorId).toBe("u1");
    expect(body.entries[0].actorRole).toBe("OWNER");
    expect(body.entries[0].hash).toBe("abc");
    // createdAt is serialized by Prisma; assert it is a string, not a secret.
    expect(typeof body.entries[0].createdAt).toBe("string");
    expect(body).not.toHaveProperty("passwordHash");
    expect(body).not.toHaveProperty("refreshTokenHash");
    expect(m.users).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "tenant-a", deletedAt: null } }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenant-a" }) }));
  });

  it("never returns another tenant's members or actions even when the caller holds audit:read", async () => {
    m.actor.mockResolvedValue(otherActor);
    m.permission.mockResolvedValue(undefined);
    m.users.mockResolvedValue([{ id: "u2", email: "b@example.com", name: "Owner B", role: "OWNER", status: "ACTIVE" }]);
    m.audit.mockResolvedValue([
      { id: "entry-2", createdAt: new Date().toISOString(), entityName: "ORDER", entityId: "order-2", actionType: "CREATED", actorId: "u2", actorRole: "OWNER", hash: "xyz" },
    ]);
    const response = await GET(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.tenantId).toBe("tenant-b");
    expect(body.members[0].email).toBe("b@example.com");
    expect(body.entries[0].entityId).toBe("order-2");
    expect(m.users).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "tenant-b", deletedAt: null } }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenant-b" }) }));
  });

  it("returns an empty dataset for a tenant with no recorded activity", async () => {
    m.actor.mockResolvedValue(ownActor);
    m.permission.mockResolvedValue(undefined);
    m.users.mockResolvedValue([]);
    m.audit.mockResolvedValue([]);
    const response = await GET(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.members).toEqual([]);
    expect(body.entries).toEqual([]);
    expect(body.nextCursor).toBeNull();
  });

  it("supports a bounded search query without leaking unrelated tenants", async () => {
    m.actor.mockResolvedValue(ownActor);
    m.permission.mockResolvedValue(undefined);
    m.audit.mockResolvedValue([]);
    const response = await GET(request("order-1"));
    expect(response.status).toBe(200);
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenantId: "tenant-a",
        OR: [{ entityId: { contains: "order-1" } }, { actorId: { contains: "order-1" } }],
      }),
    }));
  });

  it("rejects a search query over 100 characters", async () => {
    m.actor.mockResolvedValue(ownActor);
    m.permission.mockResolvedValue(undefined);
    const response = await GET(request("x".repeat(101)));
    expect(response.status).toBe(400);
    expect(m.audit).not.toHaveBeenCalled();
  });

  it("does not let a clerk see the member list even within their own tenant", async () => {
    m.actor.mockResolvedValue(clerkActor);
    m.permission.mockResolvedValue(undefined);
    m.users.mockResolvedValue([]);
    m.audit.mockResolvedValue([]);
    const response = await GET(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.members).toEqual([]);
    expect(body.entries).toEqual([]);
  });
});