/*
  HotelsVendors economics engine.
  Computes the win-win split on a Payment Guarantee Order (PGO).

  Legal posture:
  - HotelsVendors is NOT a lender. It never funds from its own balance sheet.
  - A LICENSED FUNDER (bank / factoring company) issues the guarantee and provides capital.
  - HotelsVendors earns an assurance/orchestration margin + takes a share of the
    supplier early-payment discount. This keeps us as a compliance & SaaS provider,
    not a regulated financial institution.

  All monetary inputs/outputs are in piastres (EGP * 100).
*/

export type PgoInputs = {
  faceValue: number;          // order value guaranteed to supplier (piastres)
  termDays: number;           // hotel repayment term (30/60/90)
  supplierDiscountBps: number; // early-payment discount conceded by supplier (e.g. 300 = 3%)
  hotelFeeBps: number;        // platform + assurance fee charged to hotel
  funderSpreadBps: number;    // funder annualized yield (APR-equiv, e.g. 1800 = 18%)
  platformMarginBps: number;  // HotelsVendors keeps this slice of the discount
  riskScore?: string;         // A+, AA-, B+ ...
};

export type PgoBreakdown = {
  faceValue: number;
  supplierEarlyPay: number;      // what supplier receives now (face - discount)
  supplierDiscount: number;      // discount amount conceded
  hotelRepayment: number;        // what hotel repays at term end
  hotelFee: number;              // platform+assurance fee added for hotel
  funderDeployed: number;        // capital funder deploys today
  funderReturn: number;          // funder gross return at term
  funderYield: number;           // funder net gain
  platformMargin: number;        // HotelsVendors margin (from discount + fee slice)
  effectiveAprPct: number;       // annualized cost to hotel
  everyoneWins: boolean;
};

export function computePgo(inp: PgoInputs): PgoBreakdown {
  const {
    faceValue,
    termDays,
    supplierDiscountBps,
    hotelFeeBps,
    funderSpreadBps,
    platformMarginBps,
  } = inp;

  const bps = (v: number, b: number) => Math.round((v * b) / 10000);

  // Supplier concedes a discount to get paid on GRN instead of waiting termDays.
  const supplierDiscount = bps(faceValue, supplierDiscountBps);
  const supplierEarlyPay = faceValue - supplierDiscount;

  // Funder deploys the early-pay amount today, earns a time-based spread.
  const funderDeployed = supplierEarlyPay;
  const funderReturn = bps(funderDeployed, Math.round((funderSpreadBps * termDays) / 365));
  const funderYield = funderReturn;

  // Hotel repays face value + a platform/assurance fee at term end.
  const hotelFee = bps(faceValue, hotelFeeBps);
  const hotelRepayment = faceValue + hotelFee + funderReturn;

  // HotelsVendors margin = share of supplier discount + a slice of hotel fee.
  const platformMargin = bps(faceValue, platformMarginBps) + Math.round(hotelFee * 0.5);

  // Effective annualized cost to hotel
  const hotelCost = hotelFee + funderReturn;
  const effectiveAprPct = faceValue > 0 ? ((hotelCost / faceValue) * (365 / termDays)) * 100 : 0;

  const everyoneWins =
    supplierEarlyPay > 0 &&
    funderYield > 0 &&
    platformMargin > 0 &&
    hotelRepayment > faceValue;

  return {
    faceValue,
    supplierEarlyPay,
    supplierDiscount,
    hotelRepayment,
    hotelFee,
    funderDeployed,
    funderReturn,
    funderYield,
    platformMargin,
    effectiveAprPct: Math.round(effectiveAprPct * 10) / 10,
    everyoneWins,
  };
}

/* Default pricing per risk band — the "pricing model" the finance agents maintain. */
export const RISK_PRICING: Record<string, { supplierDiscountBps: number; hotelFeeBps: number; funderSpreadBps: number; platformMarginBps: number }> = {
  "AA+": { supplierDiscountBps: 250, hotelFeeBps: 120, funderSpreadBps: 1600, platformMarginBps: 100 },
  "AA-": { supplierDiscountBps: 280, hotelFeeBps: 140, funderSpreadBps: 1800, platformMarginBps: 110 },
  "A+":  { supplierDiscountBps: 300, hotelFeeBps: 150, funderSpreadBps: 1850, platformMarginBps: 120 },
  "B+":  { supplierDiscountBps: 380, hotelFeeBps: 200, funderSpreadBps: 2100, platformMarginBps: 150 },
  "B-":  { supplierDiscountBps: 450, hotelFeeBps: 260, funderSpreadBps: 2400, platformMarginBps: 180 },
};

export function pricingForScore(score: string) {
  return RISK_PRICING[score] ?? RISK_PRICING["A+"];
}
