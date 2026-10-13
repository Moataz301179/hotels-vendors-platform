import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const redirect = vi.hoisted(() => vi.fn((path: string) => { throw new Error(`redirect:${path}`); }));
vi.mock("next/navigation", () => ({ redirect }));
import SupplierHome from "../../app/(dashboard)/supplier-central/page";
import SupplierCatalog from "../../app/(dashboard)/supplier-central/catalog/page";
import SupplierOrders from "../../app/(dashboard)/supplier-central/orders/page";
import Compliance from "../../app/(dashboard)/eta-compliance/page";
import { SandboxDrawer } from "../../components/dashboard/sandbox-drawer";

describe("Legacy workspace compatibility", () => {
  it.each([
    [SupplierHome, "/supplier"], [SupplierCatalog, "/supplier/catalog"],
    [SupplierOrders, "/supplier/orders"], [Compliance, "/invoices"],
  ])("opens the current workspace instead of legacy mocked data", (page, path) => {
    expect(() => page()).toThrow(`redirect:${path}`);
  });
  it("does not claim receipt verification or invent an invoice without evidence", () => {
    const html = renderToStaticMarkup(createElement(SandboxDrawer, {
      open: true, onClose: () => undefined,
      order: { id: "order-1", orderNumber: "PO-1", supplier: "Supplier", hotel: "Hotel", items: [], total: 100, status: "CONFIRMED" },
    }));
    expect(html).toContain("No goods receipt status provided.");
    expect(html).not.toContain("Goods Received &amp; Verified");
    expect(html).not.toContain("JSON Payload");
    expect(html).not.toContain("48h");
    expect(html).not.toContain("38–48");
  });
});
