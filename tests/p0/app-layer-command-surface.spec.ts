import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

describe("app-layer command surface", () => {
  const header = read("components/v2/app-header.tsx");
  const palette = read("components/v2/command-palette.tsx");

  it("exposes a global search trigger and mounts the palette in the workspace header", () => {
    expect(header).toContain("app-top-search");
    expect(header).toContain("hv:open-palette");
    expect(header).toContain("<CommandPalette role={role}/>");
  });

  it("keeps the ⌘K / Ctrl+K contract: toggle, escape, arrows, enter", () => {
    expect(palette).toContain("event.key.toLowerCase() === 'k'");
    expect(palette).toContain("event.key === 'Escape'");
    expect(palette).toContain("ArrowDown");
    expect(palette).toContain("ArrowUp");
    expect(palette).toContain("event.key === 'Enter'");
  });

  it("searches the tenant-scoped endpoint rather than a client-side list", () => {
    expect(palette).toContain("/api/v2/search?q=");
  });
});

describe("app-layer API guardrails", () => {
  const search = read("app/api/v2/search/route.ts");
  const actionQueue = read("app/api/v2/action-queue/route.ts");

  it("requires authentication before any search", () => {
    expect(search).toContain("UNAUTHENTICATED");
    expect(search.indexOf("if (!user) return")).toBeLessThan(search.indexOf("await requireAnyPermission("));
  });

  it("enforces RBAC and tenant scope on search", () => {
    expect(search).toContain("requireAnyPermission");
    expect(search).toContain("tenantId: user.tenantId");
  });

  it("never widens supplier scope past the tenant boundary", () => {
    expect(actionQueue).toContain("tenantId: user.tenantId");
    expect(actionQueue).not.toContain("{supplierId:user.supplierId}");
  });

  it("keeps the action queue read-only", () => {
    expect(actionQueue).not.toContain("prisma.order.update");
    expect(actionQueue).not.toContain("prisma.order.create");
    expect(actionQueue).toContain("requireAnyPermission");
  });
});

describe("visual workflow status", () => {
  const chain = read("components/v2/workflow-chain.tsx");

  it("renders the full chain with a highlighted current step", () => {
    expect(chain).toContain("is-current");
    expect(chain).toContain("is-done");
    expect(chain).toContain("Request");
    expect(chain).toContain("Receive");
  });

  it("flags rejected, disputed and cancelled orders instead of a stage", () => {
    expect(chain).toContain("REJECTED");
    expect(chain).toContain("DISPUTED");
    expect(chain).toContain("CANCELLED");
  });
});

describe("detail drawer (no context loss)", () => {
  const drawer = read("components/v2/order-drawer.tsx");
  const ordersClient = read("components/v2/orders-client.tsx");
  const route = read("app/api/v2/orders/[orderId]/route.ts");

  it("opens from the order list and closes without unmounting the queue", () => {
    expect(ordersClient).toContain("setDetailId(x.id)");
    expect(ordersClient).toContain("<OrderDrawer");
    expect(drawer).toContain("event.key === 'Escape'");
    expect(drawer).toContain("drawer-backdrop");
  });

  it("loads a tenant-scoped detail record with approvals and receipts", () => {
    expect(route).toContain("requirePermission");
    expect(route).toContain("tenantId: user.tenantId");
    expect(route).toContain("approvals");
    expect(route).toContain("goodsReceiptNote.findMany");
  });
});

describe("saved views and faceted filters", () => {
  const savedViews = read("components/v2/saved-views.tsx");
  const ordersClient = read("components/v2/orders-client.tsx");

  it("persists named filter combinations locally", () => {
    expect(savedViews).toContain("localStorage.setItem");
    expect(savedViews).toContain("localStorage.getItem");
  });

  it("filters the queue by term, status and ETA state", () => {
    expect(ordersClient).toContain("filters.q");
    expect(ordersClient).toContain("filters.status");
    expect(ordersClient).toContain("filters.eta");
  });
});

describe("KPI sparklines and drill-down", () => {
  const trends = read("app/api/v2/dashboard/trends/route.ts");
  const dashboard = read("app/(app)/dashboard/page.tsx");
  const sparkline = read("components/v2/sparkline.tsx");

  it("serves a tenant-scoped six-month series", () => {
    expect(trends).toContain("tenantId: user.tenantId");
    expect(trends).toContain("requireAnyPermission");
    expect(trends).toContain("offset = 5");
  });

  it("renders a sparkline only when a trend exists for that metric", () => {
    expect(dashboard).toContain("metric.trend&&trends&&<Sparkline");
    expect(dashboard).toContain("/api/v2/dashboard/trends");
    expect(sparkline).toContain("<polyline");
  });
});

