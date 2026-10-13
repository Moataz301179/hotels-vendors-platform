/** Only verified local pages are navigation targets; API-only modules are not advertised as ready pages. */
export const adminTools = [
  { id: "organizations", title: "Organizations", permission: "admin:manage_tenants", href: "/admin/tenants", description: "Review hotel groups, suppliers and other organizations with explicit platform-wide access." },
  { id: "people", title: "People & access", permission: "admin:manage_tenants", href: "/admin/users", description: "Review application accounts and assigned roles. Permission changes require a separately secured workflow." },
  { id: "audit", title: "Audit & evidence", permission: "audit:read", href: "/admin/audit", description: "Inspect recorded actions and evidence. Record integrity is not a claim of global audit completeness." },
  { id: "authority", title: "Approval rules", permission: "admin:read", href: "/admin/rules", description: "Inspect procurement approval rules. Financial and authority overrides require independent authorization." },
  { id: "support", title: "Support queue", permission: "admin:manage_tenants", href: "/admin/support", description: "Filter platform ticket metadata without exposing private customer conversations." },
  { id: "system", title: "System health", permission: "admin:read", href: "/admin/system", description: "Check database reachability and configuration presence without revealing secret values." },
  { id: "procurement", title: "Procurement", permission: "admin:manage_tenants", href: "/admin/procurement", description: "Inspect orders, recorded totals and payment-guarantee status." },
  { id: "catalog", title: "Catalog", permission: "admin:manage_tenants", href: "/admin/catalog", description: "Review fixed pricing, real availability and product provenance." },
  { id: "verification", title: "Verification", permission: "admin:manage_tenants", href: "/admin/verification", description: "Review suppliers and prepare evidence-backed verification requests." },
  { id: "documents", title: "Evidence registry", permission: "admin:manage_tenants", href: "/admin/documents", description: "Find document record IDs and ownership without exposing private files." },
  { id: "logistics", title: "Logistics", permission: "admin:manage_tenants", href: "/admin/logistics", description: "Inspect shipment progress and hub routing without exposing driver contacts." },
  { id: "returns", title: "Returns", permission: "admin:manage_tenants", href: "/admin/returns", description: "Review return requests and recorded quantities." },
  { id: "finance", title: "Finance", permission: "admin:manage_tenants", href: "/admin/finance", description: "Review recorded invoices and platform fees by currency." },
  { id: "automation", title: "Automation", permission: "admin:manage_tenants", href: "/admin/automation", description: "Inspect job history, approval requirements and attempts." },
  { id: "compliance", title: "Compliance exceptions", permission: "admin:manage_tenants", href: "/admin/compliance", description: "Review recovery status without exposing private integration payloads." },
  { id: "approvals", title: "Change approvals", permission: "admin:manage_tenants", href: "/admin/approvals", description: "Request, independently approve or cancel controlled operational changes." },
  { id: "reports", title: "Reports", permission: "report:read", href: "/admin/reports", description: "Download bounded, audited CSV reports with spreadsheet injection protection." },
] as const;

export const adminWorkstreams = [
  { title: "Verification", detail: "Business documents, reviewer decisions and supplier verification", gate: "Private document access and verification workflow must pass end-to-end checks." },
  { title: "Procurement", detail: "Orders, fixed-price catalog and approval exceptions", gate: "Order transitions remain subject to the authority matrix and real payment guarantees." },
  { title: "Logistics & returns", detail: "Delivery evidence, return requests and disputes", gate: "Carrier assignment and scoped evidence access must be verified." },
  { title: "Finance oversight", detail: "Fees, reconciliation and partner settlement exceptions", gate: "No funder decisions or monetary overrides are enabled by this console." },
  { title: "Integrations & compliance", detail: "Connection status, webhook failures and compliance exceptions", gate: "Credentials and raw compliance payloads remain server-side; connections require live validation." },
  { title: "Automation", detail: "Schedules, queues, failed jobs and execution history", gate: "Retry controls require idempotency and verified queue connectivity." },
  { title: "Support", detail: "Tickets, ownership, escalation and resolution history", gate: "Support access must stay scoped and audited." },
  { title: "System & recovery", detail: "Release identity, configuration health and backup evidence", gate: "Configuration edits are disabled; recovery requires a tested, controlled procedure." },
] as const;
