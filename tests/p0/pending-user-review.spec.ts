import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ actor: vi.fn(), users: vi.fn(), user: vi.fn(), userUpdate: vi.fn(), tenant: vi.fn(), tenantUpdate: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));

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
    m.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({ user: { update: m.userUpdate }, tenant: { update: m.tenantUpdate } }));
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
  });
});
