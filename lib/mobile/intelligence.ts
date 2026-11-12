import type { MobileWorkspace } from "@/lib/mobile/workspace";

export type ProposalAction =
  | "receive"
  | "confirm-code"
  | "respond"
  | "compare"
  | "track"
  | "request"
  | "desk"
  | "wait";

export type Proposal = {
  action: ProposalAction;
  targetId: string | null;
  evidence: Array<{ key: string; value: string }>;
  authority: "server";
};

export type WorkFacts = {
  workspace: MobileWorkspace;
  deskPath: string | null;
  receivable: { id: string; orderNumber: string; remaining: number } | null;
  unconfirmedCode: { id: string; orderNumber: string } | null;
  supplierRequest: { id: string; itemName: string; quantity: number } | null;
  quoteResponses: { count: number; productName: string | null } | null;
  tracking: { id: string; orderNumber: string; status: string } | null;
  openRequests: number;
};

/**
 * Next action from facts the server already loaded.
 * The result copies those facts. It does not invent a price, quantity, or name,
 * and it does not authorize the action.
 */
export function proposeNextAction(facts: WorkFacts): Proposal {
  if (facts.workspace === "desk") {
    return {
      action: "desk",
      targetId: null,
      evidence: facts.deskPath ? [{ key: "desk", value: facts.deskPath }] : [],
      authority: "server",
    };
  }
  if (facts.receivable) {
    return {
      action: "receive",
      targetId: facts.receivable.id,
      evidence: [
        { key: "order", value: facts.receivable.orderNumber },
        { key: "remaining", value: String(facts.receivable.remaining) },
      ],
      authority: "server",
    };
  }
  if (facts.unconfirmedCode) {
    return {
      action: "confirm-code",
      targetId: facts.unconfirmedCode.id,
      evidence: [{ key: "order", value: facts.unconfirmedCode.orderNumber }],
      authority: "server",
    };
  }
  if (facts.supplierRequest) {
    return {
      action: "respond",
      targetId: facts.supplierRequest.id,
      evidence: [
        { key: "item", value: facts.supplierRequest.itemName },
        { key: "quantity", value: String(facts.supplierRequest.quantity) },
      ],
      authority: "server",
    };
  }
  if (facts.quoteResponses && facts.quoteResponses.count > 0) {
    const evidence = [{ key: "responses", value: String(facts.quoteResponses.count) }];
    if (facts.quoteResponses.productName) evidence.push({ key: "item", value: facts.quoteResponses.productName });
    return { action: "compare", targetId: null, evidence, authority: "server" };
  }
  if (facts.tracking) {
    return {
      action: "track",
      targetId: facts.tracking.id,
      evidence: [
        { key: "order", value: facts.tracking.orderNumber },
        { key: "status", value: facts.tracking.status },
      ],
      authority: "server",
    };
  }
  if (facts.workspace === "hotel" && facts.openRequests === 0) {
    return { action: "request", targetId: null, evidence: [], authority: "server" };
  }
  if (facts.openRequests > 0) {
    return {
      action: "wait",
      targetId: null,
      evidence: [{ key: "requests", value: String(facts.openRequests) }],
      authority: "server",
    };
  }
  return { action: "wait", targetId: null, evidence: [], authority: "server" };
}

export type Checkpoint = {
  key: "assigned" | "accepted" | "picked-up" | "in-transit" | "delivered";
  at: string | null;
  state: "done" | "current" | "waiting";
};

export type TrackingInput = {
  assignmentStatus: string | null;
  shipmentStatus: string | null;
  assignedAt: string | null;
  respondedAt: string | null;
  dispatchDate: string | null;
  estimatedArrival: string | null;
  deliveredAt: string | null;
};

/** Checkpoints that exist on the carrier portal record. Missing steps stay waiting. */
export function carrierCheckpoints(input: TrackingInput): Checkpoint[] {
  const accepted = input.assignmentStatus === "ACCEPTED" || input.assignmentStatus === "DELIVERED";
  const delivered = input.assignmentStatus === "DELIVERED" || input.shipmentStatus === "DELIVERED";
  const inTransit = delivered || input.shipmentStatus === "IN_TRANSIT";
  const pickedUp = inTransit || input.shipmentStatus === "PICKED_UP";
  const assigned = Boolean(input.assignmentStatus);

  const steps: Array<{ key: Checkpoint["key"]; done: boolean; at: string | null }> = [
    { key: "assigned", done: assigned, at: input.assignedAt },
    { key: "accepted", done: accepted, at: accepted ? input.respondedAt : null },
    { key: "picked-up", done: pickedUp, at: pickedUp ? input.dispatchDate : null },
    { key: "in-transit", done: inTransit, at: inTransit ? input.estimatedArrival : null },
    { key: "delivered", done: delivered, at: delivered ? input.deliveredAt : null },
  ];

  const currentIndex = steps.findIndex((step) => !step.done);
  return steps.map((step, index) => ({
    key: step.key,
    at: step.done ? step.at : null,
    state: step.done ? "done" : index === currentIndex ? "current" : "waiting",
  }));
}
