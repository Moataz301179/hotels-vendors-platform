import { beforeEach, describe, expect, it, vi } from "vitest";
import { accessPool, accessPoolsFor, isAccountAdmin, organizationRoleForPool } from "@/lib/access/pillar-access";
import { etaEInvoicingConfiguration } from "@/lib/eta/configuration";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  users: vi.fn(),
  user: vi.fn(),
  roleUpsert: vi.fn(),
  permissionUpsert: vi.fn(),
  rolePermissionUpsert: vi.fn(),
  rolePermissionDelete: vi.fn(),
  permissionFind: vi.fn(),
  grantUpdate: vi.fn(),
  userUpdate: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findMany: m.users, findFirst: m.user, update: m.userUpdate },
  role: { upsert: m.roleUpsert },
  permission: { upsert: m.permissionUpsert, findMany: m.permissionFind },
  rolePermission: { upsert: m.rolePermissionUpsert, deleteMany: m.rolePermissionDelete },
  userPermissionGrant: { updateMany: m.grantUpdate },
  $transaction: m.transaction,
} }));

import { GET, POST } from "@/app/api/v2/organization/access/route";

describe("four-pillar access pools", () => {
  it("keeps placing a request separate from accepting an order", () => {
    const place = accessPool("HOTEL", "hotel_place_requests");
    const accept = accessPool("HOTEL", "hotel_accept_orders");
    expect(place?.permissions).toContain("order:create");
    expect(place?.permissions).not.toContain("order:approve");
    expect(accept?.permissions).toContain("order:approve");
    expect(accept?.permissions).not.toContain("order:create");
    expect(organizationRoleForPool("hotel_accept_orders")).toBe("FINANCIAL_CONTROLLER");
    expect(organizationRoleForPool("hotel_receive_deliveries")).toBe("RECEIVING_CLERK");
    expect(organizationRoleForPool("hotel_place_requests")).toBe("DEPARTMENT_HEAD");
    expect(organizationRoleForPool("carrier_view_tasks")).toBeNull();
    expect(accessPoolsFor("SUPPLIER").map((pool) => pool.id)).toEqual(["vendor_answer_requests", "vendor_fulfil_orders", "vendor_submit_einvoices"]);
    expect(accessPoolsFor("SHIPPING").map((pool) => pool.id)).toEqual(["carrier_view_tasks", "carrier_run_deliveries"]);
    expect(accessPoolsFor("FACTORING").map((pool) => pool.id)).toEqual(["funder_review_records", "funder_decide_funding"]);
    expect(isAccountAdmin({ role: "OWNER", platformRole: "HOTEL" })).toBe(true);
    expect(isAccountAdmin({ role: "DEPARTMENT_HEAD", platformRole: "HOTEL" })).toBe(false);
  });

  it("reports e-invoice configuration without returning credential values", () => {
    const result = etaEInvoicingConfiguration({
      ETA_API_URL: "https://eta.example",
      ETA_IDENTITY_URL: "https://id.example",
      ETA_CLIENT_ID: "client-secret-value",
      ETA_CLIENT_SECRET: "secret-value",
      ETA_CALLBACK_API_KEY: "callback-value",
      ETA_REGISTRATION_NUMBER: "123",
      ETA_ENVIRONMENT: "preprod",
      ETA_SUBMISSION_ENABLED: "false",
    });
    expect(result).toMatchObject({ submissionEnabled: false, environment: "preprod", credentialsComplete: true, hardwareSigning: "NOT_CONFIGURED", missing: [] });
    expect(JSON.stringify(result)).not.toContain("secret-value");
    expect(etaEInvoicingConfiguration({}).credentialsComplete).toBe(false);
  });
});

describe("account admin access choice", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "owner", tenantId: "hotel-tenant", platformRole: "HOTEL", role: "OWNER" });
    m.users.mockResolvedValue([{ id: "buyer", name: "Buyer", email: "buyer@hotel.test", role: "DEPARTMENT_HEAD", assignedRole: null }]);
    m.user.mockResolvedValue({ id: "buyer", role: "DEPARTMENT_HEAD", roleId: "old-role" });
    m.roleUpsert.mockResolvedValue({ id: "pool-role" });
    m.permissionUpsert.mockImplementation(({ where }: { where: { code: string } }) => Promise.resolve({ id: `perm-${where.code}` }));
    m.rolePermissionUpsert.mockResolvedValue({});
    m.rolePermissionDelete.mockResolvedValue({ count: 0 });
    m.permissionFind.mockResolvedValue([{ id: "perm-order:create" }]);
    m.grantUpdate.mockResolvedValue({ count: 1 });
    m.userUpdate.mockResolvedValue({ id: "buyer", roleId: "pool-role", role: "FINANCIAL_CONTROLLER" });
    m.audit.mockResolvedValue(undefined);
    m.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({
      role: { upsert: m.roleUpsert },
      permission: { upsert: m.permissionUpsert, findMany: m.permissionFind },
      rolePermission: { upsert: m.rolePermissionUpsert, deleteMany: m.rolePermissionDelete },
      userPermissionGrant: { updateMany: m.grantUpdate },
      user: { update: m.userUpdate },
    }));
  });

  it("shows the hotel recommendations to the account admin", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.accountAdmin).toBe(true);
    expect(body.pools.map((pool: { id: string }) => pool.id)).toContain("hotel_accept_orders");
  });

  it("lets the account admin assign order acceptance and audits the choice", async () => {
    const response = await POST(new Request("https://hotelsvendors.test/api/v2/organization/access", { method: "POST", body: JSON.stringify({ userId: "buyer", poolId: "hotel_accept_orders" }) }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ accessPoolId: "hotel_accept_orders", permissions: ["order:read", "order:approve", "order:reject"], organizationRole: "FINANCIAL_CONTROLLER" });
    expect(m.userUpdate).toHaveBeenCalledWith({ where: { id: "buyer" }, data: { roleId: "pool-role", role: "FINANCIAL_CONTROLLER" }, select: { id: true, roleId: true, role: true } });
    expect(m.grantUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "buyer", revokedAt: null }), data: expect.objectContaining({ revokedById: "owner" }) }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "hotel-tenant", changes: expect.objectContaining({ accessPool: "hotel_accept_orders" }) }), expect.anything());
  });

  it("refuses a member who is not the account admin", async () => {
    m.actor.mockResolvedValue({ id: "buyer", tenantId: "hotel-tenant", platformRole: "HOTEL", role: "DEPARTMENT_HEAD" });
    const response = await POST(new Request("https://hotelsvendors.test/api/v2/organization/access", { method: "POST", body: JSON.stringify({ userId: "buyer", poolId: "hotel_accept_orders" }) }));
    expect(response.status).toBe(403);
    expect(m.userUpdate).not.toHaveBeenCalled();
  });

  it("refuses a pool from another pillar", async () => {
    const response = await POST(new Request("https://hotelsvendors.test/api/v2/organization/access", { method: "POST", body: JSON.stringify({ userId: "buyer", poolId: "funder_decide_funding" }) }));
    expect(response.status).toBe(404);
    expect(m.userUpdate).not.toHaveBeenCalled();
  });
});
