import { describe, expect, it } from "vitest";

import { roleWorkspace } from "@/lib/dashboard/role-workspace";

describe("role workspace foundations", () => {
  it("gives hotel users an evidence-to-approval sourcing workspace", () => {
    const workspace = roleWorkspace("HOTEL");
    expect(workspace?.title).toBe("Sourcing control");
    expect(workspace?.actions.map((action) => action.title)).toEqual(["Source catalog items", "Review comparable terms", "Follow approvals"]);
  });

  it("gives supplier users a distinct catalog and fulfillment workspace", () => {
    const workspace = roleWorkspace("SUPPLIER");
    expect(workspace?.title).toBe("Catalog and fulfillment");
    expect(workspace?.actions.map((action) => action.title)).not.toContain("Follow approvals");
  });

  it("gives receiving clerks a distinct physical-receipt workspace", () => {
    const workspace = roleWorkspace("HOTEL", "RECEIVING_CLERK");
    expect(workspace?.title).toBe("Receiving control");
    expect(workspace?.actions.map((action) => action.title)).toContain("Record controlled receipt");
  });

  it("gives financial controllers an approval and reconciliation workspace", () => {
    const workspace = roleWorkspace("HOTEL", "FINANCIAL_CONTROLLER");
    expect(workspace?.title).toBe("Approval and reconciliation");
  });
});
