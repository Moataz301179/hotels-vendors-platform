import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  userCount: vi.fn(),
  productCount: vi.fn(),
  directoryCandidateCount: vi.fn(),
  invoiceGroupBy: vi.fn(),
  paymentGroupBy: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: m.userCount },
    product: { count: m.productCount },
    directoryCandidate: { count: m.directoryCandidateCount },
    invoice: { groupBy: m.invoiceGroupBy },
    payment: { groupBy: m.paymentGroupBy },
  },
}));

import { GET } from "@/app/api/v2/admin/operations-summary/route";

describe("admin operations summary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "admin-1", tenantId: "platform", platformRole: "ADMIN" });
    m.userCount.mockResolvedValue(3);
    m.productCount.mockResolvedValue(4);
    m.directoryCandidateCount.mockResolvedValue(5);
    m.invoiceGroupBy.mockResolvedValue([
      { paymentStatus: "UNPAID", _count: { _all: 2 }, _sum: { total: 1200, platformFee: 20, hotelAdminFeeAmount: 10 } },
      { paymentStatus: "PAID", _count: { _all: 1 }, _sum: { total: 800, platformFee: 16, hotelAdminFeeAmount: 8 } },
      { paymentStatus: "FACTORED", _count: { _all: 1 }, _sum: { total: 500, platformFee: 10, hotelAdminFeeAmount: 5 } },
    ]);
    m.paymentGroupBy.mockResolvedValue([
      { status: "PENDING", _count: { _all: 2 }, _sum: { amount: 1200 } },
      { status: "PAID", _count: { _all: 1 }, _sum: { amount: 800 } },
    ]);
  });

  it("rejects anonymous and non-administrator callers before querying operating data", async () => {
    m.actor.mockResolvedValueOnce(null);
    const anonymous = await GET();
    expect(anonymous.status).toBe(401);
    expect(anonymous.headers.get("Cache-Control")).toBe("private, no-store");

    m.actor.mockResolvedValueOnce({ id: "hotel-user", tenantId: "hotel-1", platformRole: "HOTEL" });
    const hotelUser = await GET();
    expect(hotelUser.status).toBe(403);
    expect(hotelUser.headers.get("Cache-Control")).toBe("private, no-store");
    expect(m.userCount).not.toHaveBeenCalled();
    expect(m.invoiceGroupBy).not.toHaveBeenCalled();
  });

  it("returns only aggregate queues and cash-status totals with private caching", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      reviewQueues: { pendingRegistrations: 3, pendingCatalogReviews: 4, pendingDirectoryCandidates: 5 },
      collections: {
        outstandingInvoices: 2,
        openInvoiceFaceValue: 1200,
        paidInvoices: 1,
        paidGross: 800,
        factoredInvoices: 1,
        factoredGross: 500,
        cashBasisPlatformFees: 24,
        paymentTransactions: { pending: 2, paid: 1 },
      },
    });
    expect(m.invoiceGroupBy).toHaveBeenCalledWith(expect.objectContaining({
      by: ["paymentStatus"],
      where: { deletedAt: null },
    }));
    expect(m.paymentGroupBy).toHaveBeenCalledWith(expect.objectContaining({
      by: ["status"],
      where: { deletedAt: null },
    }));
  });
});
