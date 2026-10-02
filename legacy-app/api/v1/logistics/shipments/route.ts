/**
 * /api/v1/logistics/shipments
 * POST → create + book a shipment (wired to cost matrix + tracking + notify)
 * GET  → list shipments with live stage timeline
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { quoteCorridor } from "@/lib/logistics/cost-matrix";
import { ShipmentTracker, TRANSITIONS, ShipmentStage } from "@/lib/logistics/tracking";
import { makeWaybillQr } from "@/lib/logistics/grn";
import { dispatchNotifications, roleRecipients, NotifyRole, stageNotification } from "@/lib/logistics/notifications";
import { shipmentStore, metaStore } from "@/lib/logistics/shipment-store";

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();

  const orderNumber = body.orderNumber as string;
  const destinationCity = body.to as string;
  const service = (body.service === "EXPRESS" ? "EXPRESS" : "REGULAR") as "EXPRESS" | "REGULAR";
  const providerId = (body.providerId as string) || "bosta";
  const parcels = Number(body.parcels) || 1;
  const weightKg = Number(body.weightKg) || 1;

  if (!orderNumber || !destinationCity) return error("orderNumber and to are required", 400);

  const q = quoteCorridor(destinationCity, parcels, weightKg, service, providerId);
  const id = `SHP-${Date.now().toString(36).toUpperCase()}`;
  const tracker = new ShipmentTracker({ stage: "CREATED", actor: "SYSTEM", actorId: "system", note: "Shipment created", at: new Date().toISOString() });
  shipmentStore.set(id, tracker);

  const waybillQr = makeWaybillQr(id, `EWB-${id.slice(4)}`, "382-910-112", parcels);
  metaStore.set(id, {
    id, orderNumber, providerId, providerName: q.provider, destinationCity, service,
    discountedTotal: q.discountedTotal, standardTotal: q.standardTotal, savingsPercent: q.savingsPercent,
    buyerId: auth.userId, supplierId: (body.supplierId as string) || "sup-demo", waybillQr, parcels, weightKg,
  });

  for (const role of roleRecipients("CREATED")) {
    await dispatchNotifications(stageNotification(id, "CREATED", orderNumber, role as NotifyRole, auth.userId));
  }

  return success({
    shipmentId: id, orderNumber, provider: q.provider, providerId, service, destinationCity,
    discountedTotal: q.discountedTotal, standardTotal: q.standardTotal, savingsPercent: q.savingsPercent,
    transitDays: q.transitDays, stage: tracker.stage, waybillQr, steps: TRANSITIONS[tracker.stage as ShipmentStage],
  }, 201);
});

export const GET = apiRoute(async (request: NextRequest) => {
  const rows = [...metaStore.entries()].map(([id, meta]) => {
    const t = shipmentStore.get(id);
    return { ...meta, stage: t?.stage, stageLabel: t?.stageLabel, timeline: t?.timeline };
  });
  return success({ shipments: rows });
});
