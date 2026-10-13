import { describe, expect, it } from "vitest";
import { adminTenantQuery, adminUserQuery } from "@/lib/validators/admin-directory";
describe("admin directory bounds", () => {
  it("defaults to bounded first page", () => { expect(adminUserQuery.parse({})).toMatchObject({ limit: 20, page: 1 }); });
  it.each([0, -1, 101, "NaN", 1.5])("rejects unsafe limit %s", limit => { expect(adminUserQuery.safeParse({ limit }).success).toBe(false); });
  it.each([0, -1, 10001, "NaN", 1.5])("rejects unsafe page %s", page => { expect(adminTenantQuery.safeParse({ page }).success).toBe(false); });
  it("rejects unrecognized filters and client tenant scope", () => { expect(adminUserQuery.safeParse({ role: "SUPERUSER" }).success).toBe(false); expect(adminTenantQuery.safeParse({ tenantId: "another" }).success).toBe(false); });
  it("bounds search input", () => { expect(adminUserQuery.safeParse({ search: "x".repeat(121) }).success).toBe(false); });
});
