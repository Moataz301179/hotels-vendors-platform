/**
 * Signed-in HOVIN procurement assistant: system prompt, empty-tool honesty,
 * and workspace navigation actions. Never treat empty telemetry as insight.
 */

import type { AssistantAction } from "@/lib/ai/public-assistant";

export type ToolSnapshot = {
  name: string;
  result: Record<string, unknown>;
  evidence: { source: "prisma"; observedAt: string; scope: string };
};

export const TENANT_ASSISTANT_SYSTEM = [
  "You are HOVIN, the HOTELSVENDORS procurement assistant for a signed-in hospitality organization.",
  "Speak as a practical hospitality procurement guide: F&B openings, guest rooms, housekeeping, engineering, RFQs, receiving, and demand planning.",
  "Use tool observations only when they contain real non-empty records. Empty counts (0, null, {}, []) are not insight — say the workspace has no recorded activity yet and guide the user to the next product step.",
  "Never dump raw tool JSON, observedAt timestamps, or filler like “use the empty tools”. Prefer short guidance (under 180 words).",
  "Never invent supplier names, private commercial terms, stock levels, binding prices, savings percentages, approvals, or delivery dates.",
  "Buyer-facing discovery keeps vendor identity sealed until authorized execution and invoicing stages.",
  "When the user asks about opening a restaurant, bar, kitchen, or new outlet inside a hotel: outline a sourcing checklist (tableware, smallwares, disposables, cold chain, cleaning, FF&E), then route them to Source supplies / marketplace and sealed RFQ — do not pretend telemetry exists.",
  "After onboarding, the first commercial gate is funder credit-line legibility. Without a funder-approved credit line, orders cannot be placed and the full dashboard stays gated. Payment and credit approvals come solely from the funder; HotelsVendors only records clean status.",
  "When tools/telemetry are empty or the user asks about buying/ordering without a facility: say honestly that credit eligibility / funder approval is required, and point to /credit-line — never invent an approved limit.",
  "When recommending a next step, name the workspace path plainly (Credit line, Source supplies, Approvals, Receiving, Market Compass, Volume planning).",
  "Distinguish observed records from recommendations. If data is sparse, lead with guidance and product paths, not empty metrics.",
].join("\n");

const SIGNED_IN_ACTION_CATALOG: Array<{
  id: string;
  label: string;
  href: string;
  match: RegExp;
  roles?: string[];
}> = [
  {
    id: "credit-line",
    label: "Credit-line status",
    href: "/credit-line",
    match:
      /\b(credit|legibilit|funders?|facilit(y|ies)|limits?|underwrit|cannot order|place an? order|before (i |we )?buy|eligibility|await(ing)? (funder|approval))\b/i,
    roles: ["HOTEL", "SUPPLIER", "FACTORING", "ADMIN"],
  },
  {
    id: "source-supplies",
    label: "Source supplies",
    href: "/workspace/marketplace",
    match:
      /\b(restaurants?|kitchens?|bars?|outlets?|openings?|open(ing)?|ff&?e|tableware|smallwares|catalogu?es?|marketplace|sourc(e|es|ing)|buy|purchases?|procurement|supplies?|equipment|disposables?)\b/i,
    roles: ["HOTEL", "ADMIN"],
  },
  {
    id: "restaurants-category",
    label: "Restaurants & bars catalogue",
    href: "/marketplace?category=Restaurants%20%26%20bars",
    match: /\b(restaurants?|bars?|kitchens?|f&?b|food.?beverage|outlets?|dining)\b/i,
    roles: ["HOTEL", "ADMIN"],
  },
  {
    id: "approvals",
    label: "Review approvals",
    href: "/orders?view=approval",
    match: /\b(approv(e|ed|al|als|ing)|authority|purchase orders?|po\b|sign.?offs?)\b/i,
    roles: ["HOTEL", "ADMIN"],
  },
  {
    id: "receiving",
    label: "Receiving workspace",
    href: "/orders?view=receiving",
    match: /\b(receiv(e|ed|ing|ables?)|grn|goods.?receipts?|deliver(y|ies)|hovin)\b/i,
    roles: ["HOTEL", "ADMIN"],
  },
  {
    id: "market-compass",
    label: "Market Compass",
    href: "/intelligence",
    match: /\b(intelligence|signals?|compass|opportunit(y|ies)|virtual.?shadow|insights?)\b/i,
    roles: ["HOTEL", "ADMIN"],
  },
  {
    id: "volume-planning",
    label: "Volume planning",
    href: "/demand-aggregation",
    match: /\b(demand|volumes?|aggregat(e|es|ed|ing|ion)|plan(ning)?|forecasts?|repeats?)\b/i,
    roles: ["HOTEL", "ADMIN"],
  },
  {
    id: "vendor-catalogue",
    label: "Catalogue & stock",
    href: "/suppliers",
    match: /\b(catalogu?es?|stock|skus?|list(ing|ings)?|products?)\b/i,
    roles: ["SUPPLIER"],
  },
  {
    id: "vendor-orders",
    label: "Order fulfilment",
    href: "/orders",
    match: /\b(orders?|fulfil(ment|led|ling)?|dispatches?|rfqs?|quotes?)\b/i,
    roles: ["SUPPLIER"],
  },
  {
    id: "carrier-tasks",
    label: "Delivery tasks",
    href: "/carrier",
    match: /\b(deliver(y|ies|ed|ing)?|shipments?|carriers?|handoffs?|pickups?)\b/i,
    roles: ["SHIPPING"],
  },
  {
    id: "funding",
    label: "Funding records",
    href: "/funding",
    match: /\b(fund(s|ing|ed)?|factor(s|ing|ed)?|invoices?|receivables?|cash.?flows?)\b/i,
    roles: ["FACTORING", "HOTEL", "SUPPLIER"],
  },
  {
    id: "dashboard",
    label: "Open dashboard",
    href: "/dashboard",
    match: /\b(dashboards?|today|workspaces?|home|overviews?)\b/i,
  },
];

/** True when a tool result has no actionable records for the model to cite. */
export function isEmptyToolResult(name: string, result: Record<string, unknown>): boolean {
  switch (name) {
    case "spend_snapshot": {
      const count = Number(result.orderCount ?? 0);
      return !Number.isFinite(count) || count <= 0;
    }
    case "rfq_pipeline": {
      const total = Number(result.total ?? 0);
      const byStatus = result.byStatus;
      const statusEmpty =
        !byStatus ||
        typeof byStatus !== "object" ||
        Object.keys(byStatus as object).length === 0 ||
        Object.values(byStatus as Record<string, unknown>).every((value) => Number(value) <= 0);
      return (!Number.isFinite(total) || total <= 0) && statusEmpty;
    }
    case "inventory_alerts": {
      const count = Number(result.count ?? 0);
      const alerts = result.alerts;
      return (Array.isArray(alerts) ? alerts.length === 0 : true) && (!Number.isFinite(count) || count <= 0);
    }
    case "opportunity_snapshot": {
      const open = Number(result.openProductIntelligenceOpportunities ?? 0);
      return !Number.isFinite(open) || open <= 0;
    }
    case "cashflow_alerts": {
      const overdue = Number(result.overdueInvoiceCount ?? 0);
      const invoices = result.invoices;
      return (Array.isArray(invoices) ? invoices.length === 0 : true) && (!Number.isFinite(overdue) || overdue <= 0);
    }
    case "catalog_snapshot": {
      const products = Number(result.activeVerifiedProducts ?? 0);
      return !Number.isFinite(products) || products <= 0;
    }
    case "fee_calculation":
      return false;
    default: {
      const values = Object.values(result);
      if (values.length === 0) return true;
      return values.every((value) => {
        if (value == null) return true;
        if (typeof value === "number") return value === 0;
        if (typeof value === "string") return value === "" || value === "0" || value === "0.00";
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === "object") return Object.keys(value as object).length === 0;
        return false;
      });
    }
  }
}

/**
 * Compact, model-facing tool context. Empty tools become one-line honesty notes
 * without observedAt dumps. Populated tools keep a short JSON payload (no need
 * to force the model to recite timestamps).
 */
export function formatToolContextForModel(tools: ToolSnapshot[]): string {
  if (tools.length === 0) {
    return "No authorized tool snapshots were available for this actor.";
  }
  return tools
    .map((tool) => {
      if (isEmptyToolResult(tool.name, tool.result)) {
        return `${tool.name}: EMPTY — no recorded activity in this tenant scope. Do not treat as insight; guide the user to the next workspace step instead.`;
      }
      return `${tool.name} [scope=${tool.evidence.scope}]: ${JSON.stringify(tool.result)}`;
    })
    .join("\n");
}

export function summarizeToolEmptiness(tools: ToolSnapshot[]): {
  emptyTools: string[];
  populatedTools: string[];
  allEmpty: boolean;
} {
  const emptyTools = tools.filter((tool) => isEmptyToolResult(tool.name, tool.result)).map((tool) => tool.name);
  const populatedTools = tools.filter((tool) => !isEmptyToolResult(tool.name, tool.result)).map((tool) => tool.name);
  return {
    emptyTools,
    populatedTools,
    allEmpty: tools.length > 0 && emptyTools.length === tools.length,
  };
}

/** Resolve signed-in navigation actions grounded in product paths. */
export function resolveTenantActions(question: string, platformRole: string): AssistantAction[] {
  const matched = SIGNED_IN_ACTION_CATALOG.filter((entry) => {
    if (entry.roles && !entry.roles.includes(platformRole)) return false;
    return entry.match.test(question);
  });
  const seen = new Set<string>();
  const actions: AssistantAction[] = [];
  for (const entry of matched) {
    if (seen.has(entry.href)) continue;
    seen.add(entry.href);
    actions.push({ id: entry.id, label: entry.label, href: entry.href });
    if (actions.length >= 4) break;
  }
  if (actions.length === 0) {
    if (platformRole === "HOTEL") {
      actions.push(
        { id: "credit-line", label: "Credit-line status", href: "/credit-line" },
        { id: "source-supplies", label: "Source supplies", href: "/workspace/marketplace" },
        { id: "dashboard", label: "Open dashboard", href: "/dashboard" }
      );
    } else if (platformRole === "SUPPLIER") {
      actions.push(
        { id: "credit-line", label: "Credit-line status", href: "/credit-line" },
        { id: "vendor-catalogue", label: "Catalogue & stock", href: "/suppliers" },
        { id: "dashboard", label: "Open dashboard", href: "/dashboard" }
      );
    } else if (platformRole === "FACTORING") {
      actions.push(
        { id: "credit-line", label: "Credit applications", href: "/credit-line" },
        { id: "dashboard", label: "Open dashboard", href: "/dashboard" }
      );
    } else {
      actions.push({ id: "dashboard", label: "Open dashboard", href: "/dashboard" });
    }
  }
  return actions;
}

export function buildTenantSystemPrompt(args: {
  platformRole: string;
  tenantId: string;
  tools: ToolSnapshot[];
}): string {
  const emptiness = summarizeToolEmptiness(args.tools);
  const emptinessNote = emptiness.allEmpty
    ? "All authorized tool snapshots are EMPTY for this tenant. If the user wants to buy or place an order, route them to credit-line legibility / await funder approval first. Do not invent metrics, credit limits, or empty-tool findings."
    : emptiness.emptyTools.length > 0
      ? `Empty tools (ignore as insight): ${emptiness.emptyTools.join(", ")}. Populated tools: ${emptiness.populatedTools.join(", ") || "none"}.`
      : "Authorized tools returned recorded activity — cite only those populated results when relevant.";

  return [
    TENANT_ASSISTANT_SYSTEM,
    `Authenticated role: ${args.platformRole}; tenant scope: ${args.tenantId}. Never reveal or infer data outside this tenant.`,
    emptinessNote,
    "Authorized read-only tool results:",
    formatToolContextForModel(args.tools),
  ].join("\n");
}
