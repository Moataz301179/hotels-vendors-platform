import { describe, expect, it } from "vitest";
import { requireTenant, tenantWhereClause } from "@/lib/tenant/scope";

describe("P0 tenant isolation", () => {
  it("always injects the authenticated tenant into query scope", () => {
    const where = tenantWhereClause(
      { tenantId: "tenant-a", platformRole: "HOTEL", userId: "user-a" },
      { status: "ACTIVE" },
    );
    expect(where).toEqual({ tenantId: "tenant-a", status: "ACTIVE" });
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
