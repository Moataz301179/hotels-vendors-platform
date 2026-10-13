import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(), supplierFind: vi.fn(), orderCount: vi.fn(), productCount: vi.fn(),
  supplierCount: vi.fn(), auditCount: vi.fn(), tripFind: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server-auth", () => ({ requireServerPermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  supplier: { findFirst: mocks.supplierFind, count: mocks.supplierCount },
  order: { count: mocks.orderCount }, product: { count: mocks.productCount },
  auditLog: { count: mocks.auditCount }, trip: { findMany: mocks.tripFind },
} }));
import { loadSupplierData } from "../../components/dashboards/supplier/module";
import { loadAdminData } from "../../components/dashboards/admin/module";
import { loadShippingData } from "../../components/dashboards/shipping/module";

describe("Dashboard loader authorization and honest metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.supplierFind.mockResolvedValue({ id: "supplier-1" });
    mocks.orderCount.mockResolvedValue(3);
    mocks.productCount.mockResolvedValue(2);
    mocks.supplierCount.mockResolvedValue(1);
    mocks.auditCount.mockResolvedValue(4);
    mocks.tripFind.mockResolvedValue([]);
  });
  it("does not query business data when permission is denied", async () => {
    mocks.permission.mockRejectedValue(new Error("Permission denied"));
    await expect(loadSupplierData("supplier-1")).rejects.toThrow("Permission denied");
    expect(mocks.supplierFind).not.toHaveBeenCalled();
    expect(mocks.orderCount).not.toHaveBeenCalled();
  });
  it("rejects a supplier outside the authenticated tenant before loading orders", async () => {
    mocks.permission.mockResolvedValue({ id: "user-1", tenantId: "tenant-1", platformRole: "SUPPLIER" });
    mocks.supplierFind.mockResolvedValue(null);
    await expect(loadSupplierData("supplier-other")).rejects.toThrow("authenticated tenant");
    expect(mocks.supplierFind).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "supplier-other", tenantId: "tenant-1", deletedAt: null } }));
    expect(mocks.orderCount).not.toHaveBeenCalled();
  });
  it("does not represent order volume as collected revenue", async () => {
    mocks.permission.mockResolvedValue({ id: "user-1", tenantId: "tenant-1", platformRole: "SUPPLIER" });
    expect(await loadSupplierData("supplier-1")).toMatchObject({ ordersReceived: 3, revenueThisMonth: null, activeContracts: null });
  });
  it("rejects non-admin actors even if a permission mock grants access", async () => {
    mocks.permission.mockResolvedValue({ id: "user-1", tenantId: "tenant-1", platformRole: "HOTEL" });
    await expect(loadAdminData()).rejects.toThrow("administrator");
    expect(mocks.orderCount).not.toHaveBeenCalled();
  });
  it("scopes admin metrics to the account tenant and leaves unmeasured metrics unavailable", async () => {
    mocks.permission.mockResolvedValue({ id: "user-1", tenantId: "tenant-1", platformRole: "ADMIN" });
    expect(await loadAdminData()).toMatchObject({ totalOrders: 3, feeRevenue: null, crossTenantFlags: null });
    expect(mocks.orderCount).toHaveBeenCalledWith({ where: { tenantId: "tenant-1", deletedAt: null } });
  });
  it("reports no on-time percentage when completed delivery timestamps are missing", async () => {
    mocks.permission.mockResolvedValue({ id: "user-1", tenantId: "tenant-1", platformRole: "SHIPPING" });
    mocks.tripFind.mockResolvedValue([{ status: "DELIVERED", stops: [{ status: "DELIVERED", estimatedArrival: null, eta: null, actualArrival: null, arrivedAt: null }] }]);
    expect(await loadShippingData()).toMatchObject({ onTimeRate: null, fuelCostEstimate: null });
    expect(mocks.tripFind).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "tenant-1", deletedAt: null } }));
  });
});
