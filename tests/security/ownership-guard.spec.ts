import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/api-utils", () => ({ ApiError: class extends Error { constructor(message: string, public statusCode: number) { super(message); } } }));
import { requirePublishedSupplier, requireSupplierOwnership } from "@/lib/admin/ownership-guard";
const ctx = { userId: "admin", tenantId: "tenant-a", platformRole: "ADMIN" };
describe("supplier ownership automation guardrails", () => {
  it("rejects a supplier from another tenant", async () => {
    const db = { supplier: { findFirst: vi.fn().mockResolvedValue(null) } };
    await expect(requireSupplierOwnership(db, ctx, "supplier-b")).rejects.toMatchObject({ statusCode: 403 });
  });
  it("requires active verified supplier before publication", () => {
    expect(() => requirePublishedSupplier({ isVerified: false, status: "ACTIVE" })).toThrow("active and verified");
    expect(() => requirePublishedSupplier({ isVerified: true, status: "PENDING" })).toThrow("active and verified");
    expect(() => requirePublishedSupplier({ isVerified: true, status: "ACTIVE" })).not.toThrow();
  });
});
