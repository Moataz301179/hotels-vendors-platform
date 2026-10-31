import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  targetTenant: vi.fn(),
  permission: vi.fn(),
  tenant: vi.fn(),
  update: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/admin/managed-hotel-tenants", () => ({ managedHotelTenant: m.targetTenant }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/prisma", () => ({ prisma: { tenant: { findFirst: m.tenant, update: m.update } } }));

import { GET, PATCH } from "@/app/api/v2/admin/tenant-consent-policy/route";

const ownActor = { id: "hotel-admin", tenantId: "hotel-tenant", platformRole: "HOTEL" };
const adminActor = { id: "platform-admin", tenantId: "platform-tenant", platformRole: "ADMIN" };

function patchRequest(body: unknown, tenantId = "hotel-tenant") {
  return new Request("https://hotelsvendors.com/api/v2/admin/tenant-consent-policy", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tenantId, defaultConsentLegalBasis: "EXPLICIT_CONSENT", ...body }),
  });
}

function getRequest(tenantId: string | null) {
  const url = tenantId
    ? `https://hotelsvendors.com/api/v2/admin/tenant-consent-policy?tenantId=${tenantId}`
    : "https://hotelsvendors.com/api/v2/admin/tenant-consent-policy";
  return new Request(url);
}

describe("tenant consent-policy tenancy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.audit.mockResolvedValue({});
    m.permission.mockResolvedValue(undefined);
    m.tenant.mockResolvedValue({ id: "hotel-tenant", name: "Hotel Tenant", defaultConsentLegalBasis: "CONTRACT" });
    m.update.mockResolvedValue({ id: "hotel-tenant", name: "Hotel Tenant", defaultConsentLegalBasis: "EXPLICIT_CONSENT" });
  });

  it("lets a delegated non-ADMIN manage their own tenant", async () => {
    m.actor.mockResolvedValue(ownActor);
    const response = await PATCH(patchRequest({ tenantId: "hotel-tenant" }));
    expect(response.status).toBe(200);
    expect(m.tenant).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "hotel-tenant", deletedAt: null } }));
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "hotel-tenant" } }));
    expect(m.audit).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "hotel-tenant", changes: expect.objectContaining({ crossTenant: false }) })
    );
  });

  it("rejects a non-ADMIN targeting another tenant BEFORE any tenant lookup", async () => {
    m.actor.mockResolvedValue(ownActor);
    const response = await PATCH(patchRequest({ tenantId: "other-tenant" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "CONSENT_MANAGE_OWN_TENANT_ONLY" });
    expect(m.tenant).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it("rejects a non-ADMIN GET for another tenant before any tenant lookup", async () => {
    m.actor.mockResolvedValue(ownActor);
    const response = await GET(getRequest("other-tenant"));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "CONSENT_MANAGE_OWN_TENANT_ONLY" });
    expect(m.tenant).not.toHaveBeenCalled();
  });

  it("GET with no tenantId returns the caller's own tenant", async () => {
    m.actor.mockResolvedValue(ownActor);
    const response = await GET(getRequest(null));
    expect(response.status).toBe(200);
    expect(m.tenant).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "hotel-tenant", deletedAt: null } }));
  });

  it("lets a platform ADMIN target a managed hotel tenant", async () => {
    m.actor.mockResolvedValue(adminActor);
    m.targetTenant.mockResolvedValue({ id: "hotel-tenant" });
    const response = await PATCH(patchRequest({ tenantId: "hotel-tenant" }));
    expect(response.status).toBe(200);
    expect(m.tenant).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "hotel-tenant", deletedAt: null } }));
    expect(m.audit).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "hotel-tenant", changes: expect.objectContaining({ crossTenant: true }) })
    );
  });

  it("rejects an ADMIN targeting an unmanaged tenant", async () => {
    m.actor.mockResolvedValue(adminActor);
    m.targetTenant.mockResolvedValue(null);
    const response = await PATCH(patchRequest({ tenantId: "stranger-tenant" }));
    expect(response.status).toBe(404);
    expect(m.tenant).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
  });

  it("requires consent:manage permission", async () => {
    m.actor.mockResolvedValue(ownActor);
    m.permission.mockRejectedValue(new PermissionDeniedError("denied"));
    const response = await PATCH(patchRequest({ tenantId: "hotel-tenant" }));
    expect(response.status).toBe(403);
    expect(m.tenant).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers", async () => {
    m.actor.mockResolvedValue(null);
    const response = await PATCH(patchRequest({ tenantId: "hotel-tenant" }));
    expect(response.status).toBe(401);
    expect(m.tenant).not.toHaveBeenCalled();
  });

  it("audit record is attributed to the affected tenant, not the actor's tenant", async () => {
    m.actor.mockResolvedValue(adminActor);
    m.targetTenant.mockResolvedValue({ id: "hotel-tenant" });
    await PATCH(patchRequest({ tenantId: "hotel-tenant" }));
    expect(m.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        entityName: "TENANT",
        entityId: "hotel-tenant",
        tenantId: "hotel-tenant",
        actorId: "platform-admin",
        actorRole: "ADMIN",
      })
    );
  });
});