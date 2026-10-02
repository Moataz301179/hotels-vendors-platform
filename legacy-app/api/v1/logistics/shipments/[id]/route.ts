/**
 * /api/v1/logistics/shipments/[id]
 *   POST { action:"advance", stage, note?, gps? }  — authorized stage transition
 *   POST { action:"grn", lines[], qr?, signedBy? } — dock QR scan + reconcile
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { TRANSITIONS, ShipmentStage, ShipperRole } from "@/lib/logistics/tracking";
import { reconcileGrn, accountabilityDecision, DEFAULT_TERMS, GrnLine } from "@/lib/logistics/grn";
import { dispatchNotifications, roleRecipients, NotifyRole, stageNotification } from "@/lib/logistics/notifications";

/* Shared in-memory stores (same module-scope as collection route via a small data module) */
import { shipmentStore, metaStore } from "@/lib/logistics/shipment-store";

function roleToActor(platformRole: string): ShipperRole {
  const map: Record<string, ShipperRole> = { HOTEL: "BUYER", SUPPLIER: "SUPPLIER", SHIPPING: "DRIVER", ADMIN: "DISPATCHER" };
  return map[platformRole] || "SYSTEM";
}

export const POST = apiRoute(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await authenticate(request);
  const id = params.id;
  const tracker = shipmentStore.get(id);
  if (!tracker) return error("Shipment not found", 404);

  const body = await request.json().catch(() => ({}));
  const actor = { role: roleToActor(auth.platformRole), id: auth.userId };
  const meta = metaStore.get(id);

  if (body.action === "grn") {
    if (tracker.stage !== "ARRIVED_DOCK" && tracker.stage !== "IN_TRANSIT") {
      return error(`Cannot GRN from stage ${tracker.stage}`, 400);
    }
    const lines = body.lines as GrnLine[];
    const updated = tracker.advance("GOODS_RECEIVED", { role: "DOCK", id: (body.signedBy as string) || auth.userId }, { qrCodeVerified: !!body.qr });
    const grn = reconcileGrn(id, lines, (body.signedBy as string) || auth.userId, body.qr ? "QR_SCAN" : "MANUAL");
    const accountability = grn.discrepancies.length ? accountabilityDecision(grn, DEFAULT_TERMS) : { liableParty: "NONE", amount: 0, note: "No discrepancy" };
    return success({ shipmentId: id, grn, accountability, stage: updated || tracker.stage });
  }

  // advance
  const next = body.stage as ShipmentStage;
  const updated = tracker.advance(next, actor, { note: body.note, gps: body.gps });
  if (!updated) return error(`Transition ${tracker.stage} → ${next} not allowed for ${actor.role}`, 403);
  for (const role of roleRecipients(updated)) {
    await dispatchNotifications(stageNotification(id, updated, meta?.orderNumber || id, role as NotifyRole, auth.userId));
  }
  return success({ shipmentId: id, from: (tracker.timeline.at(-1) as any)?.prevStage, stage: updated, steps: TRANSITIONS[updated] });
});
