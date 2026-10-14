import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ tenant: vi.fn(), hotel: vi.fn(), supplier: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { tenant: { findFirst: m.tenant }, hotel: { findFirst: m.hotel }, supplier: { findFirst: m.supplier } } }));

import { FinancialAccessDeniedError, requireFinancialAccess } from "@/lib/auth/financial-access";

describe("financial access tax verification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.tenant.mockResolvedValue({ id: "hotel-tenant" });
    m.hotel.mockResolvedValue({ id: "hotel" });
    m.supplier.mockResolvedValue({ id: "supplier" });
  });

  it("requires an active, tax-verified tenant before a hotel can create financial work", async () => {
    m.tenant.mockResolvedValue(null);
    await expect(requireFinancialAccess({ tenantId: "hotel-tenant", platformRole: "HOTEL" })).rejects.toMatchObject({ code: "TAX_ID_VERIFICATION_REQUIRED" });
    expect(m.hotel).not.toHaveBeenCalled();
  });

  it("requires an active verified supplier record in addition to the tenant tax verification", async () => {
    m.supplier.mockResolvedValue(null);
    await expect(requireFinancialAccess({ tenantId: "supplier-tenant", platformRole: "SUPPLIER", supplierId: "supplier" })).rejects.toBeInstanceOf(FinancialAccessDeniedError);
    expect(m.supplier.mock.calls[0][0].where).toMatchObject({ tenantId: "supplier-tenant", isVerified: true, status: "ACTIVE" });
  });
});
