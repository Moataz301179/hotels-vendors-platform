import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

describe("connection-management authority", () => {
  const seed = read("prisma/seed.ts");
  const route = read("app/api/v2/hotel/connectors/route.ts");
  const center = read("components/v2/connections-center.tsx");
  const hotels = read("app/api/v2/hotels/route.ts");

  it("grants integration:manage only to the hotel management roles", () => {
    expect(seed).toContain('"integration:manage"');
    const owner = seed.match(/name: "Owner"[\s\S]*?permissions: \[([^\]]*)\]/);
    const manager = seed.match(/name: "Hotel Manager"[\s\S]*?permissions: \[([^\]]*)\]/);
    const departmentHead = seed.match(/name: "Department Head"[\s\S]*?permissions: \[([^\]]*)\]/);
    const clerk = seed.match(/name: "Clerk"[\s\S]*?permissions: \[([^\]]*)\]/);
    expect(owner?.[1]).toContain("integration:manage");
    expect(manager?.[1]).toContain("integration:manage");
    expect(departmentHead?.[1]).not.toContain("integration:manage");
    expect(clerk?.[1]).not.toContain("integration:manage");
  });

  it("keeps the server-side guard on every connector route", () => {
    expect(route).toContain("requirePermission");
    expect(route).toContain("integration:manage");
    expect(route).toContain("tenantId: actor.tenantId");
  });

  it("renders a permission-denied state instead of hiding the capability", () => {
    expect(center).toContain("permissionDenied");
    expect(center).toContain("integration:manage");
  });

  it("scopes the property picker to the caller's tenant", () => {
    expect(hotels).toContain("requireAnyPermission");
    expect(hotels).toContain("tenantId: actor.tenantId");
  });

  it("treats disconnect as a soft delete that retains imported records", () => {
    const remove = read("app/api/v2/hotel/connectors/[connectorId]/route.ts");
    expect(remove).toContain("deletedAt: new Date()");
    expect(remove).not.toContain("delete({ where: { id: connectorId } })");
  });
});
