type RoleAction = { title: string; description: string; href: string };

export type RoleWorkspace = { title: string; description: string; actions: RoleAction[] };

const hotelManagementWorkspace: RoleWorkspace = {
  title: "Portfolio control",
  description: "Review organization-wide sourcing, approvals, and evidence-backed operating signals.",
  actions: [
    { title: "Review sourcing activity", description: "Move from controlled catalog research into the RFQ workspace.", href: "/workspace/marketplace" },
    { title: "Review approval activity", description: "Follow purchase orders and authority decisions across the organization.", href: "/orders" },
    { title: "Inspect operating signals", description: "Review available procurement intelligence before deciding on action.", href: "/intelligence" },
  ],
};

const workspaces: Record<string, RoleWorkspace> = {
  HOTEL: {
    title: "Sourcing control",
    description: "Move a requirement from catalog discovery to a controlled RFQ and approval decision.",
    actions: [
      { title: "Source catalog items", description: "Search verified catalog records and request a quote without supplier disclosure.", href: "/workspace/marketplace" },
      { title: "Review comparable terms", description: "Compare recorded commercial terms before selecting a response for approval.", href: "/workspace/marketplace" },
      { title: "Follow approvals", description: "Track purchase orders and their recorded approval state.", href: "/orders" },
    ],
  },
  SUPPLIER: {
    title: "Catalog and fulfillment",
    description: "Keep product evidence ready, respond only to assigned RFQs, and follow confirmed operational work.",
    actions: [
      { title: "Complete catalog readiness", description: "Submit structured product records and supplier-owned media for review.", href: "/suppliers" },
      { title: "Respond to assigned RFQs", description: "Prepare fixed commercial terms only for requests assigned to your organization.", href: "/suppliers" },
      { title: "Follow fulfillment work", description: "Review confirmed order work and recorded exceptions.", href: "/orders" },
    ],
  },
};

const hotelRoleWorkspaces: Record<string, RoleWorkspace> = {
  RECEIVING_CLERK: {
    title: "Receiving control",
    description: "Work only on assigned receiving activity, with recorded quantity checks and controlled exceptions.",
    actions: [
      { title: "Review delivery tasks", description: "Open purchase orders that are ready for recorded receipt work.", href: "/orders" },
      { title: "Record controlled receipt", description: "Record received quantities only through the authorized goods-receipt flow.", href: "/orders" },
      { title: "Resolve quantity exceptions", description: "Surface partial or disputed receipt records for the authorized follow-up path.", href: "/orders" },
    ],
  },
  FINANCIAL_CONTROLLER: {
    title: "Approval and reconciliation",
    description: "Review recorded authority decisions, procurement commitments, and audit evidence for your organization.",
    actions: [
      { title: "Review authority decisions", description: "Open orders that are waiting for the recorded approval path.", href: "/orders" },
      { title: "Review procurement records", description: "Follow accepted commercial terms and order status without changing source data.", href: "/orders" },
      { title: "Inspect audit evidence", description: "Review organization-scoped audit history for exceptional activity.", href: "/audit" },
    ],
  },
  OWNER: hotelManagementWorkspace,
  REGIONAL_GM: hotelManagementWorkspace,
  GM: hotelManagementWorkspace,
};

export function roleWorkspace(platformRole: string | undefined, organizationRole?: string | undefined) {
  if (!platformRole) return null;
  if (platformRole === "HOTEL" && organizationRole && hotelRoleWorkspaces[organizationRole]) return hotelRoleWorkspaces[organizationRole];
  return workspaces[platformRole] ?? null;
}
