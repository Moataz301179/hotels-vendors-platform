/**
 * Isolated pilot harness for exercising the four marketplace roles.
 *
 * This module is deliberately side-effect free: it does not create Prisma
 * records, call external providers, scrape websites, send messages, or mutate
 * production state. It is a contract test fixture for the admin pilot runner.
 */

export type PilotRole = "HOTEL" | "SUPPLIER" | "CARRIER" | "FUNDER";

export type PilotEvent =
  | "REQUISITION_CREATED"
  | "QUOTE_SUBMITTED"
  | "PO_ISSUED"
  | "CARRIER_POD_VERIFIED"
  | "HOTEL_RECEIPT_ACCEPTED"
  | "FACTORING_ELIGIBLE"
  | "FUNDER_REVIEWED";

export interface PilotRecord {
  readonly id: string;
  readonly role: PilotRole;
  readonly event: PilotEvent;
  readonly source: "TEST_HARNESS";
  readonly persisted: false;
  readonly externalDispatch: false;
  readonly details: string;
}

export interface PilotRun {
  readonly runId: string;
  readonly mode: "DRY_RUN";
  readonly records: readonly PilotRecord[];
  readonly nextAction: string;
}

const PLAN: ReadonlyArray<Pick<PilotRecord, "role" | "event" | "details">> = [
  { role: "HOTEL", event: "REQUISITION_CREATED", details: "Create a requisition for a catalog item." },
  { role: "SUPPLIER", event: "QUOTE_SUBMITTED", details: "Submit a fixed-price quote against the requisition." },
  { role: "HOTEL", event: "PO_ISSUED", details: "Issue the purchase order after authority checks." },
  { role: "CARRIER", event: "CARRIER_POD_VERIFIED", details: "Verify delivery evidence before settlement eligibility." },
  { role: "HOTEL", event: "HOTEL_RECEIPT_ACCEPTED", details: "Accept the received quantity and create the GRN." },
  { role: "SUPPLIER", event: "FACTORING_ELIGIBLE", details: "Expose eligibility only after verified delivery and receipt." },
  { role: "FUNDER", event: "FUNDER_REVIEWED", details: "Review the verified receivable; no funding is executed." },
];

export function createVirtualAgentPilot(runId = `pilot-${Date.now()}`): PilotRun {
  return {
    runId,
    mode: "DRY_RUN",
    records: PLAN.map((step, index) => ({
      id: `${runId}-${index + 1}`,
      ...step,
      source: "TEST_HARNESS" as const,
      persisted: false as const,
      externalDispatch: false as const,
    })),
    nextAction: "Replace dry-run inputs with consented pilot tenant records before any live mutation.",
  };
}

export function assertVirtualAgentPilot(run: PilotRun): void {
  if (run.mode !== "DRY_RUN") throw new Error("Virtual agent pilot must remain a dry run");
  if (run.records.some((record) => record.persisted || record.externalDispatch || record.source !== "TEST_HARNESS")) {
    throw new Error("Virtual agent pilot attempted an external or persistent side effect");
  }
  const events = run.records.map((record) => record.event);
  const expected = PLAN.map((step) => step.event);
  if (JSON.stringify(events) !== JSON.stringify(expected)) {
    throw new Error("Virtual agent pilot lifecycle is out of order");
  }
}

