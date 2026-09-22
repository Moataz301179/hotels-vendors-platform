/**
 * Carrier Tracking State Machine — order stage model with role-aware changes.
 *
 * Each transition is attributed to a role (SYSTEM, DISPATCHER, DRIVER, DOCK,
 * BUYER, SUPPLIER) and writes an audit trail + triggers a notification. This is
 * the single source of truth for "where is my shipment" on web AND driver app.
 */

export type ShipmentStage =
  | "CREATED" | "PICKUP_SCHEDULED" | "PICKED_UP" | "IN_TRANSIT"
  | "ARRIVED_DOCK" | "GOODS_RECEIVED" | "COMPLETED"
  | "EXCEPTION" | "RETURNING";

export type ShipperRole = "SYSTEM" | "DISPATCHER" | "DRIVER" | "DOCK" | "BUYER" | "SUPPLIER";

export interface ShipmentEvent {
  stage: ShipmentStage;
  actor: ShipperRole;
  actorId: string;
  note?: string;
  gps?: { lat: number; lng: number };
  at: string; // ISO
  qrCodeVerified?: boolean;
  eta?: string;
}

/* Allowed transitions per current stage → next stages */
export const TRANSITIONS: Record<ShipmentStage, ShipmentStage[]> = {
  CREATED: ["PICKUP_SCHEDULED", "EXCEPTION"],
  PICKUP_SCHEDULED: ["PICKED_UP", "EXCEPTION"],
  PICKED_UP: ["IN_TRANSIT", "EXCEPTION"],
  IN_TRANSIT: ["ARRIVED_DOCK", "EXCEPTION"],
  ARRIVED_DOCK: ["GOODS_RECEIVED", "EXCEPTION", "RETURNING"],
  GOODS_RECEIVED: ["COMPLETED", "EXCEPTION"],
  COMPLETED: [],
  EXCEPTION: ["PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT", "RETURNING", "COMPLETED"],
  RETURNING: ["COMPLETED", "EXCEPTION"],
};

/* Which role is allowed to trigger each transition out of a stage */
const STAGE_ACTORS: Record<ShipmentStage, ShipperRole[]> = {
  CREATED: ["SYSTEM", "DISPATCHER"],
  PICKUP_SCHEDULED: ["DISPATCHER", "DRIVER"],
  PICKED_UP: ["DRIVER", "DISPATCHER"],
  IN_TRANSIT: ["DRIVER", "SYSTEM"],
  ARRIVED_DOCK: ["DRIVER", "DOCK"],
  GOODS_RECEIVED: ["DOCK"],
  COMPLETED: ["DOCK", "SYSTEM", "BUYER"],
  EXCEPTION: ["DRIVER", "DISPATCHER", "DOCK", "SYSTEM"],
  RETURNING: ["DRIVER", "DISPATCHER"],
};

export class ShipmentTracker {
  private history: ShipmentEvent[] = [];
  private currentStage: ShipmentStage;

  constructor(initial: ShipmentEvent) {
    this.currentStage = initial.stage;
    this.history.push(initial);
  }

  get stage(): ShipmentStage { return this.currentStage; }
  get timeline(): ShipmentEvent[] { return [...this.history]; }

  /**
   * Advance to the next stage with authorization. Returns null if not allowed,
   * otherwise records the event and returns the updated stage.
   */
  advance(next: ShipmentStage, actor: { role: ShipperRole; id: string }, opts?: Partial<Omit<ShipmentEvent, "stage" | "actor" | "actorId">>): ShipmentStage | null {
    // 1. Is the transition legal from this stage?
    if (!TRANSITIONS[this.currentStage].includes(next)) return null;
    // 2. Is this actor allowed to make that move?
    if (!STAGE_ACTORS[this.currentStage].includes(actor.role)) return null;

    const evt: ShipmentEvent = {
      stage: next,
      actor: actor.role,
      actorId: actor.id,
      note: opts?.note,
      gps: opts?.gps,
      qrCodeVerified: opts?.qrCodeVerified,
      eta: opts?.eta,
      at: opts?.at || new Date().toISOString(),
    };
    this.history.push(evt);
    const prev = this.currentStage;
    this.currentStage = next;

    // Return a signal for notification dispatch: stageChanged
    (evt as any).prevStage = prev;
    return this.currentStage;
  }

  /** Friendly human label of current stage */
  get stageLabel(): string {
    return this.currentStage.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase());
  }
}

/* Convenience: expected next steps a driver sees for the current stage */
export function nextDriverSteps(stage: ShipmentStage): string[] {
  switch (stage) {
    case "CREATED": return ["Await dispatch assignment", "Confirm pickup slot"];
    case "PICKUP_SCHEDULED": return ["Navigate to supplier warehouse", "Scan supplier e-Waybill QR", "Confirm pickup"];
    case "PICKED_UP": return ["Start route to hotel dock", "Update live GPS"];
    case "IN_TRANSIT": return ["Drive to destination", "Alert on traffic delay"];
    case "ARRIVED_DOCK": return ["Present e-Waybill QR at dock", "Wait for dock scan (GRN)"];
    case "GOODS_RECEIVED": return ["Collect signed ePOD", "Close trip"];
    default: return ["No further action"];
  }
}
