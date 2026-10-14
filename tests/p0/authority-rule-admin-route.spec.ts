import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), rules: vi.fn(), rule: vi.fn(), tenant: vi.fn(), tenants: vi.fn(), create: vi.fn(), update: vi.fn(), transaction: vi.fn(), audit: vi.fn() }));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/prisma", () => ({ prisma: { authorityRule: { findMany: m.rules, findFirst: m.rule }, tenant: { findFirst: m.tenant, findMany: m.tenants }, $transaction: m.transaction } }));

import { GET, PATCH, POST } from "@/app/api/v2/admin/authority-rules/route";

const actor = { id: "admin-user", tenantId: "platform-tenant", platformRole: "ADMIN", role: "GM" };
const request = (body: unknown) => new Request("https://hotelsvendors.com/api/v2/admin/authority-rules", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("authority rule administration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(actor);
    m.permission.mockResolvedValue(undefined);
    m.rules.mockResolvedValue([]);
    m.tenant.mockResolvedValue({ id: "hotel-tenant" });
    m.tenants.mockResolvedValue([{ id: "hotel-tenant", name: "Cairo Hotel Group" }]);
    m.rule.mockResolvedValue({ id: "rule-1", tenantId: "hotel-tenant", isActive: true });
    m.create.mockResolvedValue({ id: "rule-1", tenantId: "hotel-tenant", name: "GM up to 50k", role: "GM", action: "APPROVE" });
    m.update.mockResolvedValue({ id: "rule-1", isActive: false });
    m.audit.mockResolvedValue(undefined);
    m.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({ authorityRule: { create: m.create, update: m.update } }));
  });

  it("lists approval rules for an explicitly selected active hotel organization", async () => {
    const response = await GET(new Request("https://hotelsvendors.com/api/v2/admin/authority-rules?tenantId=hotel-tenant"));

    expect(response.status).toBe(200);
    expect(m.rules).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "hotel-tenant", deletedAt: null } }));
    expect(m.tenants).toHaveBeenCalledWith({ where: { type: "HOTEL_GROUP", status: "ACTIVE", deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  });

  it("creates an audited approval rule in the explicitly selected hotel tenant", async () => {
    const response = await POST(request({ name: "GM up to 50k", role: "GM", action: "APPROVE", minValue: "0", maxValue: "50000", priority: 10, tenantId: "hotel-tenant" }));

    expect(response.status).toBe(201);
    expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tenantId: "hotel-tenant", name: "GM up to 50k", role: "GM", action: "APPROVE", minValue: 0, maxValue: 50000, priority: 10 }) });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: "PROCUREMENT_APPROVAL_POLICY", tenantId: "hotel-tenant", changes: expect.objectContaining({ kind: "AUTHORITY_RULE" }) }), expect.anything());
  });

  it("rejects an invalid approval range", async () => {
    const response = await POST(request({ name: "Broken range", role: "GM", action: "APPROVE", minValue: "50001", maxValue: "50000" }));

    expect(response.status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("rejects a cross-tenant rule when the administrator is not in the platform tenant", async () => {
    m.tenant.mockResolvedValue(null);

    const response = await POST(request({ name: "GM up to 50k", role: "GM", action: "APPROVE", tenantId: "hotel-tenant" }));

    expect(response.status).toBe(404);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("deactivates only a rule from the selected hotel tenant and records the change", async () => {
    const response = await PATCH(request({ id: "rule-1", isActive: false, tenantId: "hotel-tenant" }));

    expect(response.status).toBe(200);
    expect(m.rule).toHaveBeenCalledWith({ where: { id: "rule-1", tenantId: "hotel-tenant", deletedAt: null }, select: { id: true, isActive: true } });
    expect(m.update).toHaveBeenCalledWith({ where: { id: "rule-1" }, data: { isActive: false } });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ actionType: "UPDATED", changes: expect.objectContaining({ kind: "AUTHORITY_RULE", fromActive: true, toActive: false }) }), expect.anything());
  });
});
