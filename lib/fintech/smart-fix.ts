/**
 * Smart Fix Autonomy (G10 — no manual intervention required)
 * When hotel is blocked by credit/risk, autonomously generate fixes:
 *  - Deposit
 *  - High-Risk Factoring
 *  - Split Payment
 *  - Auto Limit Extension
 */

export interface SmartFix {
  type: "deposit" | "high_risk_factoring" | "split_payment" | "auto_limit_extension";
  description: string;
  amount?: number;
  newLimit?: number;
  terms?: string;
}

export function generateSmartFix(
  hotelId: string,
  orderValue: number,
  currentCreditUsed: number,
  currentCreditTotal: number,
  riskScore: number
): SmartFix[] {
  const fixes: SmartFix[] = [];
  const available = currentCreditTotal - currentCreditUsed;

  if (available < orderValue) {
    // Blocked by credit/risk — generate fixes
    if (orderValue > 50000) {
      fixes.push({
        type: "high_risk_factoring",
        description: "High-value order requires factoring partner injection",
        amount: orderValue,
        terms: "non-recourse",
      });
    }
    if (riskScore > 70) {
      fixes.push({
        type: "deposit",
        description: "Deposit required for high-risk transaction",
        amount: Math.round(orderValue * 0.3),
      });
    }
    if (available > 0 && available < orderValue) {
      fixes.push({
        type: "split_payment",
        description: `Split payment: use available ${available} + financing for remainder`,
        amount: orderValue - available,
      });
    }
    fixes.push({
      type: "auto_limit_extension",
      description: "Auto credit limit extension for verified hotel",
      newLimit: Math.round(currentCreditTotal * 1.25),
    });
  }
  return fixes;
}
