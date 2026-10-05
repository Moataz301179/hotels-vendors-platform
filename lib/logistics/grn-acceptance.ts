export type ReceiptOrderLine = { id: string; productId: string; quantity: number };
export type ReceiptLineInput = { orderItemId: string; receivedQuantity: number; acceptedQuantity: number; rejectionReason?: string | null; batchNumber?: string | null; expiryDate?: string | null; conditionNotes?: string | null };
export type ValidatedReceiptLine = ReceiptLineInput & { productId: string; orderedQuantity: number; rejectedQuantity: number };
export type ReceiptValidation =
  | { ok: true; lines: ValidatedReceiptLine[]; grnStatus: "ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED"; orderStatus: "PARTIALLY_DELIVERED" | "DELIVERED" }
  | { ok: false; error: string };

export function validateReceipt(
  items: ReceiptOrderLine[],
  previouslyAccepted: Record<string, number>,
  input: ReceiptLineInput[],
): ReceiptValidation {
  if (!Array.isArray(input) || input.length !== items.length) return { ok: false, error: "Receipt must include each purchase order line exactly once." };
  const itemById = new Map(items.map((item) => [item.id, item]));
  const seen = new Set<string>();
  let totalReceived = 0;
  let totalAccepted = 0;
  let totalRejected = 0;
  let allComplete = true;
  const lines: ValidatedReceiptLine[] = [];

  for (const line of input) {
    const item = itemById.get(line.orderItemId);
    if (!item || seen.has(line.orderItemId)) return { ok: false, error: "Receipt contains an unknown or duplicate purchase order line." };
    seen.add(line.orderItemId);
    const received = line.receivedQuantity;
    const accepted = line.acceptedQuantity;
    if (!Number.isSafeInteger(received) || received < 0 || !Number.isSafeInteger(accepted) || accepted < 0 || accepted > received) {
      return { ok: false, error: "Received and accepted quantities must be valid whole numbers, and accepted cannot exceed received." };
    }
    const prior = previouslyAccepted[item.id] ?? 0;
    if (!Number.isSafeInteger(prior) || prior < 0 || prior + accepted > item.quantity) return { ok: false, error: "Accepted quantity exceeds the remaining purchase order quantity." };
    const rejected = received - accepted;
    const reason = line.rejectionReason?.trim() || null;
    if (rejected > 0 && !reason) return { ok: false, error: "A rejection reason is required for rejected units." };
    if (line.expiryDate && !Number.isFinite(Date.parse(line.expiryDate))) return { ok: false, error: "Expiry dates must be valid dates." };
    if (received > item.quantity - prior) return { ok: false, error: "Received quantity exceeds the remaining purchase order quantity." };
    totalReceived += received;
    totalAccepted += accepted;
    totalRejected += rejected;
    if (prior + accepted < item.quantity) allComplete = false;
    lines.push({ ...line, rejectionReason: reason, productId: item.productId, orderedQuantity: item.quantity, rejectedQuantity: rejected });
  }

  if (totalReceived === 0) return { ok: false, error: "Enter at least one received unit to record a receipt." };
  const grnStatus = totalAccepted === 0 ? "REJECTED" : totalRejected > 0 ? "PARTIALLY_ACCEPTED" : "ACCEPTED";
  return { ok: true, lines, grnStatus, orderStatus: allComplete ? "DELIVERED" : "PARTIALLY_DELIVERED" };
}
