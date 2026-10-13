import { describe, expect, it } from "vitest";
import { assertVirtualAgentPilot, createVirtualAgentPilot } from "@/lib/pilot/virtual-agent-harness";

describe("virtual agent pilot harness", () => {
  it("runs the four-role lifecycle in the required order", () => {
    const run = createVirtualAgentPilot("test-run");
    assertVirtualAgentPilot(run);
    expect([...new Set(run.records.map((record) => record.role))]).toEqual(["HOTEL", "SUPPLIER", "CARRIER", "FUNDER"]);
    expect(run.records.map((record) => record.event)).toEqual([
      "REQUISITION_CREATED",
      "QUOTE_SUBMITTED",
      "PO_ISSUED",
      "CARRIER_POD_VERIFIED",
      "HOTEL_RECEIPT_ACCEPTED",
      "FACTORING_ELIGIBLE",
      "FUNDER_REVIEWED",
    ]);
  });

  it("cannot claim persistence or external dispatch", () => {
    const run = createVirtualAgentPilot("no-side-effects");
    expect(run.mode).toBe("DRY_RUN");
    expect(run.records.every((record) => record.persisted === false && record.externalDispatch === false)).toBe(true);
    expect(run.nextAction).toContain("consented pilot tenant records");
  });
});

