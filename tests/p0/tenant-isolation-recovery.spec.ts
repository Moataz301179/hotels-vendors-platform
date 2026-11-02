import { describe, expect, it } from "vitest";
import { tenantWhereClause, requireTenant } from "@/lib/tenant/scope";

describe("P0 tenant isolation", () => {
  it("always injects the authenticated tenant into query scope", () => {
    const where = tenantWhereClause(
      { tenantId: "tenant-a", platformRole: "HOTEL", userId: "user-a" },
      { status: "ACTIVE" },
    );
    expect(where).toEqual({ tenantId: "tenant-a", status: "ACTIVE" });
  });

  it("does not allow an additional filter to override the authenticated tenant", () => {
    expect(tenantWhereClause(
      { tenantId: "tenant-a", platformRole: "HOTEL", userId: "user-a" },
      { tenantId: "tenant-b", status: "ACTIVE" },
    )).toEqual({ tenantId: "tenant-a", status: "ACTIVE" });
  });

  it("rejects missing or invalid tenant context", () => {
    expect(() => requireTenant({ userId: "user-a" })).toThrow(/tenantId/i);
    expect(() => requireTenant({ tenantId: "x", userId: "user-a" })).toThrow(/tenantId/i);
    expect(() => requireTenant({ tenantId: "tenant-a" })).toThrow(/userId/i);
  });

  it("accepts a complete tenant context", () => {
    const ctx = { tenantId: "tenant-a", platformRole: "HOTEL", userId: "user-a" };
    expect(() => requireTenant(ctx)).not.toThrow();
  });
});
