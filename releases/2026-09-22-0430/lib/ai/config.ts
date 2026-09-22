/**
 * AI Assistant Config (G6 — Role-Specific Smart Assistant)
 * Source: AGENTS.md G6 + .hermes.md directive.
 * Each dashboard includes role-specific system prompts scoped to user's tenant.
 */

export interface AIAssistantConfig {
  role: "hotel" | "supplier" | "factoring" | "shipping" | "admin";
  tenantId: string;
  allowedDomains: string[];
}

export const AI_ROLES: Record<string, AIAssistantConfig> = {
  hotel: {
    role: "hotel",
    tenantId: "",
    allowedDomains: [
      "suggest_local_sme_suppliers",
      "optimize_procurement_spend",
      "flag_reorder_alerts",
    ],
  },
  supplier: {
    role: "supplier",
    tenantId: "",
    allowedDomains: [
      "forecast_demand",
      "suggest_pricing_adjustments",
      "flag_inventory_risks",
    ],
  },
  factoring: {
    role: "factoring",
    tenantId: "",
    allowedDomains: [
      "assess_credit_risk",
      "portfolio_yield_insights",
      "anomaly_detection",
    ],
  },
  shipping: {
    role: "shipping",
    tenantId: "",
    allowedDomains: [
      "route_optimization",
      "delivery_consolidation",
      "fuel_cost_predictions",
    ],
  },
  admin: {
    role: "admin",
    tenantId: "",
    allowedDomains: [
      "system_health",
      "fee_tracking_anomalies",
      "cross_tenant_audit_flags",
    ],
  },
};
