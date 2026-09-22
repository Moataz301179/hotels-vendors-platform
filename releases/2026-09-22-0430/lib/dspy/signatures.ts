/**
 * DSPy Signature Pattern (manual TypeScript implementation)
 * Source framework: Stanford DSPy (Python) — https://github.com/stanfordnlp/dspy
 * Pattern: Define input/output signatures for LM tasks; compile to optimized prompts.
 */

export interface Signature<Input, Output> {
  inputFields: string[];
  outputFields: string[];
  instructions: string;
}

export const HOTEL_ASSISTANT_SIG: Signature<string, string> = {
  inputFields: ["query", "context", "orders", "inventory"],
  outputFields: ["response", "actions", "confidence"],
  instructions: "Role: Hotel procurement assistant. Scope: suggest suppliers, optimize spend, reorder alerts. No cross-tenant data.",
};

export const SUPPLIER_ASSISTANT_SIG: Signature<string, string> = {
  inputFields: ["query", "context", "inventory", "contracts"],
  outputFields: ["response", "forecast", "pricing_suggestion", "confidence"],
  instructions: "Role: Supplier manager assistant. Scope: demand forecast, pricing adjustments, inventory risk flags.",
};

export const FACTORING_ASSISTANT_SIG: Signature<string, string> = {
  inputFields: ["query", "context", "credit_limit", "financing_apps"],
  outputFields: ["response", "risk_assessment", "portfolio_insight", "confidence"],
  instructions: "Role: Factoring/liquidity assistant. Scope: assess credit risk, portfolio yield, anomaly detection.",
};
