export type PoTerms = {
  quantity: number;
  unitPrice: number;
  deliveryDate: string | null;
};

export type PoChangeDecision =
  | { ok: true; action: "UNCHANGED" }
  | { ok: true; action: "PROPOSE" | "ACCEPT"; changed: string[] }
  | { ok: false; code: "INVALID_PO_CHANGE" | "NO_PO_CHANGE" | "HOTEL_ACCEPTANCE_REQUIRED"; changed?: string[] };

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export function changedPoFields(current: PoTerms, proposed: PoTerms): string[] {
  const changed: string[] = [];
  if (current.quantity !== proposed.quantity) changed.push("quantity");
  if (money(current.unitPrice) !== money(proposed.unitPrice)) changed.push("unitPrice");
  if ((current.deliveryDate ?? null) !== (proposed.deliveryDate ?? null)) changed.push("deliveryDate");
  return changed;
}

export function decidePoChange(input: {
  current: PoTerms;
  proposed: PoTerms;
  actor: "HOTEL" | "SUPPLIER" | "OTHER";
  accept: boolean;
}): PoChangeDecision {
  if (!Number.isInteger(input.proposed.quantity) || input.proposed.quantity <= 0 || !(input.proposed.unitPrice >= 0)) {
    return { ok: false, code: "INVALID_PO_CHANGE" };
  }
  if (input.proposed.deliveryDate !== null && Number.isNaN(Date.parse(input.proposed.deliveryDate))) {
    return { ok: false, code: "INVALID_PO_CHANGE" };
  }
  const changed = changedPoFields(input.current, input.proposed);
  if (changed.length === 0) return { ok: false, code: "NO_PO_CHANGE" };
  if (input.accept) {
    if (input.actor !== "HOTEL") return { ok: false, code: "HOTEL_ACCEPTANCE_REQUIRED", changed };
    return { ok: true, action: "ACCEPT", changed };
  }
  if (input.actor !== "HOTEL" && input.actor !== "SUPPLIER") {
    return { ok: false, code: "HOTEL_ACCEPTANCE_REQUIRED", changed };
  }
  return { ok: true, action: "PROPOSE", changed };
}

export function pendingPoChange(snapshot: unknown): { changed: string[]; orderItemId: string } | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const poChange = (snapshot as { poChange?: { acceptedAt?: string | null; changed?: string[]; orderItemId?: string } }).poChange;
  if (!poChange || poChange.acceptedAt || !poChange.orderItemId) return null;
  return { changed: poChange.changed ?? [], orderItemId: poChange.orderItemId };
}
