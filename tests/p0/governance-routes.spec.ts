import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  departmentFindMany: vi.fn(),
  departmentFindFirst: vi.fn(),
  departmentCreate: vi.fn(),
  accessFindMany: vi.fn(),
  accessCreateMany: vi.fn(),
  audit: vi.fn(),
  permission: vi.fn(),
  transaction: vi.fn(),
  products: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError: class PermissionDeniedError extends Error {} }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  department: { findMany: m.departmentFindMany, findFirst: m.departmentFindFirst, create: m.departmentCreate },
  departmentCategoryAccess: { findMany: m.accessFindMany },
  product: { findMany: m.products },
  $transaction: m.transaction,
} }));

import { GET as listDepartments, POST as createDepartment } from "@/app/api/v2/admin/departments/route";
import { POST as grantCategories } from "@/app/api/v2/admin/department-category-access/route";
import { GET as getCatalog } from "@/app/api/v2/catalog/route";

const admin = { id: "admin", tenantId: "tenant-1", platformRole: "ADMIN", departmentId: null };
const request = (body: unknown) => new Request("https://hotelsvendors.com/api/v2/admin/departments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("governance routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(admin);
    m.permission.mockResolvedValue(undefined);
    m.audit.mockResolvedValue(undefined);
    m.transaction.mockImplementation((fn: Function) => fn({ department: { create: m.departmentCreate }, departmentCategoryAccess: { createMany: m.accessCreateMany } }));
    m.departmentFindMany.mockResolvedValue([]);
    m.departmentFindFirst.mockResolvedValue({ id: "dept-1" });
    m.departmentCreate.mockResolvedValue({ id: "dept-1", name: "Food and Beverage", code: "FNB" });
    m.accessFindMany.mockResolvedValue([]);
    m.products.mockResolvedValue([]);
  });

  it("creates tenant-bound departments and audits the change", async () => {
    const response = await createDepartment(request({ name: "Food and Beverage", code: "FNB" }));
    expect(response.status).toBe(201);
    expect(m.departmentCreate.mock.calls[0][0].data).toMatchObject({ tenantId: "tenant-1", code: "FNB" });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: "DEPARTMENT", tenantId: "tenant-1" }), expect.anything());
  });

  it("rejects non-admin department changes", async () => {
    m.actor.mockResolvedValue({ ...admin, platformRole: "HOTEL" });
    expect((await createDepartment(request({ name: "F&B", code: "FNB" }))).status).toBe(403);
    expect(m.departmentCreate).not.toHaveBeenCalled();
  });

  it("adds only categories to a department in the authenticated tenant", async () => {
    const response = await grantCategories(request({ departmentId: "dept-1", categories: ["F_AND_B", "F_AND_B", "CONSUMABLES"] }));
    expect(response.status).toBe(200);
    expect(m.accessCreateMany.mock.calls[0][0].data).toEqual([
      { departmentId: "dept-1", category: "F_AND_B", createdById: "admin" },
      { departmentId: "dept-1", category: "CONSUMABLES", createdById: "admin" },
    ]);
  });

  it("defaults department catalog access to deny", async () => {
    m.actor.mockResolvedValue({ id: "user", tenantId: "tenant-1", platformRole: "HOTEL", departmentId: "dept-1" });
    const response = await getCatalog();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ products: [], categories: [], accessControlled: true });
    expect(m.products).not.toHaveBeenCalled();
  });

  it("queries catalog products only within granted categories", async () => {
    m.actor.mockResolvedValue({ id: "user", tenantId: "tenant-1", platformRole: "HOTEL", departmentId: "dept-1" });
    m.accessFindMany.mockResolvedValue([{ category: "F_AND_B" }]);
    const response = await getCatalog();
    expect(response.status).toBe(200);
    expect(m.products.mock.calls[0][0].where).toMatchObject({ category: { in: ["F_AND_B"] }, status: "ACTIVE" });
  });
});
