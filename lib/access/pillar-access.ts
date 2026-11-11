export const ACCOUNT_PILLARS = ["HOTEL", "SUPPLIER", "SHIPPING", "FACTORING"] as const;
export type AccountPillar = (typeof ACCOUNT_PILLARS)[number];

export type AccessPool = {
  id: string;
  pillar: AccountPillar;
  label: string;
  purpose: string;
  permissions: readonly string[];
};

const POOLS: readonly AccessPool[] = [
  { id: "hotel_place_requests", pillar: "HOTEL", label: "Place requests", purpose: "Create a hotel request and follow its status. This does not accept an order.", permissions: ["order:read", "order:create"] },
  { id: "hotel_accept_orders", pillar: "HOTEL", label: "Accept orders", purpose: "Approve or reject an order after the payment guarantee. This does not create the request.", permissions: ["order:read", "order:approve", "order:reject"] },
  { id: "hotel_receive_deliveries", pillar: "HOTEL", label: "Record receiving", purpose: "Record what arrived against an approved order.", permissions: ["order:read", "order:update"] },
  { id: "hotel_connect_einvoices", pillar: "HOTEL", label: "Connect e-invoices", purpose: "Send a minimised e-invoice summary for this hotel. It does not submit a signed tax document.", permissions: ["invoice:read", "einvoice:ingest"] },
  { id: "vendor_answer_requests", pillar: "SUPPLIER", label: "Answer allocated requests", purpose: "Read a request allocated to this vendor and submit a response.", permissions: ["order:read", "quote:submit"] },
  { id: "vendor_fulfil_orders", pillar: "SUPPLIER", label: "Fulfil accepted orders", purpose: "Confirm and update an order already assigned to this vendor.", permissions: ["order:read", "order:confirm", "order:update"] },
  { id: "vendor_submit_einvoices", pillar: "SUPPLIER", label: "Prepare e-invoices", purpose: "Read invoice records and submit a signed e-invoice when the tax connection is enabled.", permissions: ["invoice:read", "invoice:submit_eta"] },
  { id: "carrier_view_tasks", pillar: "SHIPPING", label: "View delivery tasks", purpose: "See delivery work assigned to this carrier.", permissions: ["shipping:read", "order:read"] },
  { id: "carrier_run_deliveries", pillar: "SHIPPING", label: "Run scheduled deliveries", purpose: "Create a trip and update delivery progress for an accepted assignment.", permissions: ["shipping:read", "shipping:create_trip", "order:read", "order:update"] },
  { id: "funder_review_records", pillar: "FACTORING", label: "Review funding records", purpose: "Read invoice and funding records. This does not approve a payment.", permissions: ["invoice:read", "factoring:inquire"] },
  { id: "funder_decide_funding", pillar: "FACTORING", label: "Decide funding", purpose: "Record a funding decision for a record that already meets the delivery and invoice gates.", permissions: ["invoice:read", "factoring:fund", "factoring:approve_credit"] },
];

const PERMISSION_NAMES: Record<string, string> = {
  "order:read": "View orders",
  "order:create": "Place requests",
  "order:approve": "Accept orders",
  "order:reject": "Reject orders",
  "order:update": "Update delivery or receiving",
  "order:confirm": "Confirm an assigned order",
  "quote:submit": "Answer an allocated request",
  "invoice:read": "View invoice records",
  "invoice:submit_eta": "Submit an e-invoice",
  "einvoice:ingest": "Connect e-invoice summaries",
  "shipping:read": "View delivery tasks",
  "shipping:create_trip": "Schedule a delivery trip",
  "factoring:inquire": "Review funding records",
  "factoring:fund": "Record a funding decision",
  "factoring:approve_credit": "Record a credit decision",
};

export function isAccountPillar(role: string): role is AccountPillar {
  return (ACCOUNT_PILLARS as readonly string[]).includes(role);
}

export function isAccountAdmin(actor: { role: string; platformRole: string }): boolean {
  return actor.role === "OWNER" && isAccountPillar(actor.platformRole);
}

export function accessPoolsFor(pillar: AccountPillar): AccessPool[] {
  return POOLS.filter((pool) => pool.pillar === pillar);
}

export function accessPool(pillar: AccountPillar, poolId: string): AccessPool | null {
  return accessPoolsFor(pillar).find((pool) => pool.id === poolId) ?? null;
}

export function permissionName(code: string): string {
  return PERMISSION_NAMES[code] ?? code;
}

export function pillarPermissionCodes(pillar: AccountPillar): string[] {
  return [...new Set(accessPoolsFor(pillar).flatMap((pool) => [...pool.permissions]))];
}

export function accessRoleName(poolId: string): string {
  return `ACCESS_${poolId}`;
}
