export const HOTEL_PHONE_ROLES = [
  "OWNER",
  "REGIONAL_GM",
  "GM",
  "FINANCIAL_CONTROLLER",
  "CLERK",
  "RECEIVING_CLERK",
  "LOGISTICS_COORDINATOR",
] as const;

export const RECEIVING_ROLES = [
  "OWNER",
  "REGIONAL_GM",
  "GM",
  "FINANCIAL_CONTROLLER",
  "RECEIVING_CLERK",
] as const;

export type MobileWorkspace = "hotel" | "supplier" | "carrier-code" | "desk";

export type MobileCapability =
  | "catalog"
  | "create-rfq"
  | "compare-quotes"
  | "orders"
  | "receive"
  | "upload-evidence"
  | "tracking"
  | "delivery-code"
  | "confirm-delivery-code"
  | "supplier-response"
  | "notifications";

export type MobilePlan = {
  workspace: MobileWorkspace;
  title: string;
  summary: string;
  deskPath: string;
  capabilities: MobileCapability[];
  withheld: string[];
};

const PHONE_PERMISSIONS = ["order:read", "order:create", "order:update", "quote:submit"] as const;

export function phonePermissions(permissions: readonly string[]) {
  return PHONE_PERMISSIONS.filter((code) => permissions.includes(code));
}

function can(permissions: readonly string[], code: string) {
  return permissions.includes(code);
}

/**
 * Decides the signed-in phone workspace.
 * Hotels and suppliers work on the phone. Department heads, funders, and
 * administrators stay on the desk. Carriers get the delivery code only;
 * accept and decline stay on the carrier portal.
 */
export function planMobileWorkspace(
  actor: { platformRole: string; role: string },
  permissions: readonly string[],
): MobilePlan {
  if (actor.platformRole === "HOTEL" && (HOTEL_PHONE_ROLES as readonly string[]).includes(actor.role)) {
    const receiving = (RECEIVING_ROLES as readonly string[]).includes(actor.role) && can(permissions, "order:update");
    const capabilities: MobileCapability[] = [];
    if (can(permissions, "order:read")) {
      capabilities.push("catalog", "compare-quotes", "orders", "tracking", "delivery-code", "notifications");
    }
    if (can(permissions, "order:create")) capabilities.push("create-rfq");
    if (receiving) capabilities.push("receive", "upload-evidence", "confirm-delivery-code");
    return {
      workspace: "hotel",
      title: "Hotel",
      summary: "This phone follows the signed-in hotel account: requests, recorded quotes, orders, and the delivery in front of you. Approval, payment guarantee, and invoice filing stay on the hotel desk.",
      deskPath: "/orders",
      capabilities,
      withheld: [
        "Supplier identity before an invoice exists",
        "Invoice amounts and payment configuration",
        "Binding offers and stock promises",
      ],
    };
  }

  if (actor.platformRole === "SUPPLIER") {
    const capabilities: MobileCapability[] = ["tracking"];
    if (can(permissions, "order:read")) capabilities.push("orders", "notifications");
    if (can(permissions, "quote:submit")) capabilities.push("supplier-response");
    return {
      workspace: "supplier",
      title: "Supplier",
      summary: "This phone answers requests granted to this supplier and shows the quantities to prepare. Catalog editing stays on the supplier desk.",
      deskPath: "/suppliers",
      capabilities,
      withheld: ["Other suppliers", "The hotel discovery catalogue", "Another hotel’s private terms"],
    };
  }

  if (actor.platformRole === "SHIPPING") {
    return {
      workspace: "carrier-code",
      title: "Delivery code",
      summary: "This phone shows the delivery confirmation code for a movement the carrier portal has already accepted. Accepting or declining an assignment stays on the carrier portal.",
      deskPath: "/carrier",
      capabilities: ["tracking", "delivery-code"],
      withheld: ["Assignment acceptance and decline", "Rates", "Hotel prices and invoices"],
    };
  }

  const closed = actor.platformRole === "FACTORING"
    ? { path: "/funding", title: "Funding desk", summary: "Funding review stays on the funder desk. This phone does not approve money." }
    : actor.platformRole === "ADMIN"
      ? { path: "/admin", title: "Network desk", summary: "Network control stays on the administrator desk. This phone is not a second control plane." }
      : actor.platformRole === "HOTEL" && actor.role === "DEPARTMENT_HEAD"
        ? { path: "/orders", title: "Hotel desk", summary: "Department-head approval stays on the hotel desk. This phone opens once a hotel operating role is assigned." }
        : actor.platformRole === "HOTEL"
          ? { path: "/orders", title: "Hotel desk", summary: "This hotel role has no phone workspace. Continue on the hotel desk." }
          : { path: "/dashboard", title: "HotelsVendors desk", summary: "This account has no phone workspace. Continue on the desk that matches the organization." };

  return {
    workspace: "desk",
    title: closed.title,
    summary: closed.summary,
    deskPath: closed.path,
    capabilities: [],
    withheld: [
      "Supplier identity before an invoice exists",
      "Invoice amounts and payment configuration",
      "Phone actions for this role",
    ],
  };
}
