export interface PriceBenchmark {
  productId: string;
  productName: string;
  contractedPrice: number;
  marketAverage: number;
  bestAvailable: number;
  bestSupplier: string;
  variance: number;
  variancePercent: number;
}

export interface BudgetStatus {
  departmentId: string;
  departmentName: string;
  period: string;
  totalBudget: number;
  committed: number;
  pending: number;
  available: number;
  cartTotal: number;
  willExceed: boolean;
  afterCartAvailable: number;
}

export interface PreSpendAlert {
  type: 'budget' | 'price' | 'split-order';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  action?: string;
  actionHref?: string;
}

export interface CartLineAssessment {
  productId: string;
  qty: number;
  price: number;
  benchmark?: PriceBenchmark;
  alerts: PreSpendAlert[];
}

export interface PreSpendAssessment {
  lines: CartLineAssessment[];
  budget: BudgetStatus;
  totalAlerts: number;
  criticalCount: number;
  hasBlockingIssues: boolean;
  splitOrderSuggestion?: {
    originalTotal: number;
    suggestedTotal: number;
    savings: number;
    breakdown: { supplierId: string; supplierName: string; items: string[]; subtotal: number }[];
  };
}

const PRICE_BENCHMARKS: Record<string, { marketAvg: number; bestPrice: number; bestSupplier: string }> = {
  p1: { marketAvg: 350, bestPrice: 320, bestSupplier: "Nile F&B Wholesale" },
  p2: { marketAvg: 680, bestPrice: 650, bestSupplier: "Cairo Grains Co." },
  p3: { marketAvg: 4200, bestPrice: 3900, bestSupplier: "Oils & Fats Direct" },
  p8: { marketAvg: 220, bestPrice: 195, bestSupplier: "Textile Plus" },
  p9: { marketAvg: 1200, bestPrice: 1100, bestSupplier: "Linen Express" },
};

const DEPARTMENT_BUDGETS: Record<string, { name: string; total: number; committed: number; pending: number }> = {
  hk: { name: "Housekeeping", total: 150000, committed: 45000, pending: 12000 },
  fb: { name: "F&B Kitchen", total: 300000, committed: 98000, pending: 25000 },
  am: { name: "Amenities", total: 80000, committed: 22000, pending: 8000 },
  en: { name: "Engineering", total: 200000, committed: 65000, pending: 15000 },
};

export function assessCart(
  lines: { productId: string; qty: number; price: number }[],
  departmentId: string = "hk"
): PreSpendAssessment {
  const budget = DEPARTMENT_BUDGETS[departmentId] || DEPARTMENT_BUDGETS.hk;
  const cartTotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  const lineAssessments: CartLineAssessment[] = lines.map((line) => {
    const benchmark = PRICE_BENCHMARKS[line.productId];
    const alerts: PreSpendAlert[] = [];

    if (benchmark) {
      const contractedPrice = line.price;
      const marketAvg = benchmark.marketAvg;
      const variance = contractedPrice - marketAvg;
      const variancePct = Math.round((variance / marketAvg) * 100);

      if (variancePct > 10) {
        alerts.push({
          type: 'price',
          severity: variancePct > 20 ? 'critical' : 'warning',
          title: `Price ${variancePct}% above market average`,
          detail: `EGP ${contractedPrice}/unit vs market avg EGP ${benchmark.marketAvg}. ${benchmark.bestSupplier} offers similar for EGP ${benchmark.bestPrice}.`,
          action: `Switch to ${benchmark.bestSupplier}`,
        });
      }

      if (benchmark.bestPrice < contractedPrice) {
        const savings = (contractedPrice - benchmark.bestPrice) * line.qty;
        alerts.push({
          type: 'price',
          severity: 'info',
          title: `Save EGP ${savings.toLocaleString()} with alternative supplier`,
          detail: `${benchmark.bestSupplier} offers this item at EGP ${benchmark.bestPrice}/unit — guaranteed 24h delivery.`,
          action: 'View alternative',
        });
      }
    }

    return {
      productId: line.productId,
      qty: line.qty,
      price: line.price,
      benchmark: benchmark
        ? {
            productId: line.productId,
            productName: '',
            contractedPrice: line.price,
            marketAverage: benchmark.marketAvg,
            bestAvailable: benchmark.bestPrice,
            bestSupplier: benchmark.bestSupplier,
            variance: line.price - benchmark.marketAvg,
            variancePercent: Math.round(((line.price - benchmark.marketAvg) / benchmark.marketAvg) * 100),
          }
        : undefined,
      alerts,
    };
  });

  const totalAlerts = lineAssessments.reduce((s: number, l: CartLineAssessment) => s + l.alerts.length, 0);
  const criticalCount = lineAssessments.reduce((s: number, l: CartLineAssessment) => s + l.alerts.filter((a: PreSpendAlert) => a.severity === 'critical').length, 0);
  const available = budget.total - budget.committed - budget.pending;
  const willExceed = cartTotal > available;

  const budgetAlerts: PreSpendAlert[] = [];
  if (willExceed) {
    budgetAlerts.push({
      type: 'budget',
      severity: 'critical',
      title: 'Cart exceeds available budget',
      detail: `Cart total EGP ${cartTotal.toLocaleString()} exceeds available EGP ${available.toLocaleString()} (${budget.name}: EGP ${budget.total.toLocaleString()} total, EGP ${(budget.committed + budget.pending).toLocaleString()} committed).`,
      action: 'Request budget increase',
    });
  } else if (available - cartTotal < available * 0.15) {
    budgetAlerts.push({
      type: 'budget',
      severity: 'warning',
      title: 'Budget running low',
      detail: `After this order, only EGP ${(available - cartTotal).toLocaleString()} will remain in the ${budget.name} budget.`,
    });
  }

  if (budgetAlerts.length > 0) {
    lineAssessments.push({ productId: '', qty: 0, price: 0, alerts: budgetAlerts });
  }

  const splitOrderSuggestion = suggestSplitOrder(lines);

  return {
    lines: lineAssessments,
    budget: {
      departmentId,
      departmentName: budget.name,
      period: '2026-09',
      totalBudget: budget.total,
      committed: budget.committed,
      pending: budget.pending,
      available,
      cartTotal,
      willExceed,
      afterCartAvailable: available - cartTotal,
    },
    totalAlerts,
    criticalCount,
    hasBlockingIssues: willExceed || criticalCount > 0,
    splitOrderSuggestion,
  };
}

function suggestSplitOrder(lines: { productId: string; qty: number; price: number }[]): PreSpendAssessment['splitOrderSuggestion'] | undefined {
  if (lines.length < 3) return undefined;

  const totalValue = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const potentialSavings = lines.reduce((sum, l) => {
    const benchmark = PRICE_BENCHMARKS[l.productId];
    if (benchmark && l.price > benchmark.bestPrice) {
      sum += (l.price - benchmark.bestPrice) * l.qty;
    }
    return sum;
  }, 0);

  if (potentialSavings < totalValue * 0.03) return undefined;

  return {
    originalTotal: totalValue,
    suggestedTotal: Math.round(totalValue - potentialSavings),
    savings: Math.round(potentialSavings),
    breakdown: [
      { supplierId: 's1', supplierName: 'Misr F&B Distribution', items: ['F&B lines'], subtotal: Math.round(totalValue * 0.6) },
      { supplierId: 's2', supplierName: 'Nile Housekeeping Supply Co.', items: ['HK lines'], subtotal: Math.round(totalValue * 0.4) },
    ],
  };
}

