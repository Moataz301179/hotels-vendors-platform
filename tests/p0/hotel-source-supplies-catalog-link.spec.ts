import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { navigationForRole } from "@/lib/dashboard/role-navigation";
import { roleWorkspace } from "@/lib/dashboard/role-workspace";

const root = process.cwd();
const read = (relative: string) => readFileSync(join(root, relative), "utf8");

describe("hotel Source supplies catalogue linkage", () => {
  it("routes Source supplies into the reviewed catalogue, not a disconnected workspace dead-end", () => {
    const hotelHrefs = navigationForRole("HOTEL").flatMap((group) => group.items.map((item) => ({ href: item.href, label: item.label })));
    expect(hotelHrefs).toContainEqual({ href: "/marketplace", label: "Source supplies" });
    expect(roleWorkspace("HOTEL")?.actions[0]).toMatchObject({ title: "Source catalog items", href: "/marketplace" });
  });

  it("keeps the sourcing workspace and hotel list connected back to the catalogue", () => {
    const consoleSource = read("components/v2/procurement-console.tsx");
    const workspacePage = read("app/(app)/workspace/marketplace/page.tsx");
    const hotelDashboard = read("components/dashboards/hotel/index.tsx");
    const rfqRoute = read("app/api/v2/rfq/route.ts");

    expect(consoleSource).toContain('href="/marketplace"');
    expect(consoleSource).toContain("Browse reviewed catalogue");
    expect(consoleSource).toContain('href="/workspace/marketplace/basket"');
    expect(workspacePage).toContain('href="/marketplace"');
    expect(workspacePage).toContain('href="/workspace/marketplace/basket"');
    expect(hotelDashboard).toContain('href="/marketplace"');
    expect(hotelDashboard).toContain("Source supplies");
    expect(rfqRoute).not.toContain('reasons:["SUPPLIER_CONFIRMATION_REQUIRED"]');
    expect(rfqRoute).toContain("catalogReference?.name");
    expect(rfqRoute).toContain("matchingStatus:product?'MATCHED':'QUEUED'");
  });
});
