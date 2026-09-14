/**
 * Carrier Notification Engine — push/replaceable notifications to every
 * involved party of a shipment: buyer (hotel), supplier, dispatcher, driver,
 * dock staff, and funder (only when value/factoring involved).
 *
 * Webhook-first: emits to a notifier registrar; channels (email/push/SMS/WhatsApp)
 * are plug-and-play once a provider key is configured.
 */

export type NotifyRole = "BUYER" | "SUPPLIER" | "DISPATCHER" | "DRIVER" | "DOCK" | "FUNDER";

export interface Notification {
  shipmentId: string;
  channel: "PUSH" | "EMAIL" | "SMS" | "WHATSAPP";
  toRole: NotifyRole;
  toId: string;
  title: string;
  body: string;
  stage: string;
  at: string;
}

type NotifierFn = (n: Notification) => Promise<void>;

const notifiers: NotifierFn[] = [];

export function registerNotifier(fn: NotifierFn) {
  notifiers.push(fn);
}

/**
 * Returns the set of recipients who should be notified for a shipment stage,
 * based on the correlation ID passed by the caller (home/channel providers).
 */
export function roleRecipients(stage: string, roles?: NotifyRole[]): NotifyRole[] {
  const base = roles ?? ["BUYER", "SUPPLIER", "DISPATCHER", "DRIVER", "DOCK"];
  // Resolution/critical stages loop in the funder (factoring protection)
  if (["COMPLETED", "GOODS_RECEIVED", "EXCEPTION"].includes(stage)) {
    return Array.from(new Set([...base, "FUNDER"]));
  }
  return base;
}

export async function dispatchNotifications(n: Omit<Notification, "at">): Promise<number> {
  const full: Notification = { ...n, at: new Date().toISOString() };
  let sent = 0;
  for (const fn of notifiers) {
    try { await fn(full); sent++; } catch { /* provider down — keep going to others */ }
  }
  return sent;
}

/* Pre-built human notifications per stage change */
export function stageNotification(
  shipmentId: string,
  stage: string,
  orderNumber: string,
  toRole: NotifyRole,
  toId: string,
  extras?: string
): Omit<Notification, "at"> {
  const titles: Record<string, string> = {
    CREATED: "Shipment created",
    PICKUP_SCHEDULED: "Pickup scheduled",
    PICKED_UP: "Order picked up",
    IN_TRANSIT: "Order in transit",
    ARRIVED_DOCK: "Arrived at hotel dock",
    GOODS_RECEIVED: "Goods received — GRN issued",
    COMPLETED: "Delivery completed",
    EXCEPTION: "Delivery exception",
  };
  const body = extras || `${titles[stage] || stage} — order ${orderNumber} (${shipmentId}). Track live on HotelsVendors or the INVO driver app.`;
  return {
    shipmentId,
    channel: "PUSH",
    toRole,
    toId,
    title: titles[stage] || "Shipment update",
    body,
    stage,
  };
}
