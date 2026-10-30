export type FreightOrder = {
  orderId: string;
  route: string;
  window: string;
  handling: string;
  weightKg: number;
  cubeM3: number;
};

export type FreightAllocation =
  | { ok: true; rule: "weight" | "cube"; allocations: Array<{ orderId: string; amount: number }> }
  | { ok: false; code: "NOT_CONSOLIDATABLE" | "NO_BASIS" };

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export function allocateFreight(
  orders: FreightOrder[],
  totalFreight: number,
  rule: "weight" | "cube"
): FreightAllocation {
  if (orders.length < 2) return { ok: false, code: "NOT_CONSOLIDATABLE" };
  const [first] = orders;
  if (orders.some((order) => order.route !== first.route || order.window !== first.window || order.handling !== first.handling)) {
    return { ok: false, code: "NOT_CONSOLIDATABLE" };
  }
  const basis = orders.map((order) => (rule === "weight" ? order.weightKg : order.cubeM3));
  const totalBasis = basis.reduce((sum, value) => sum + value, 0);
  if (totalBasis <= 0 || totalFreight < 0) return { ok: false, code: "NO_BASIS" };

  const allocations = orders.map((order, index) => ({
    orderId: order.orderId,
    amount: money((totalFreight * basis[index]) / totalBasis),
  }));
  const assigned = allocations.slice(0, -1).reduce((sum, line) => sum + line.amount, 0);
  allocations[allocations.length - 1].amount = money(totalFreight - assigned);
  return { ok: true, rule, allocations };
}
