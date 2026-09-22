export interface WorkingCapitalParams {
  hotelId: string;
  orderValue: number;
  supplierId: string;
  paymentTermsDays: number;
  hotelCreditScore: number;
}

export interface WorkingCapitalDecision {
  approved: boolean;
  maxAdvance: number;
  advanceRate: number;
  platformFee: number;
  supplierPayout: number;
  hotelRepaymentDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface FactoringApplication {
  id: string;
  hotelId: string;
  supplierId: string;
  orderId: string;
  invoiceId: string;
  amount: number;
  advanceRate: number;
  platformFee: number;
  status: 'pending' | 'approved' | 'funded' | 'repaid' | 'declined';
  createdAt: string;
  fundedAt?: string;
  repaymentDate: string;
}

const HOTEL_CREDIT_PROFILES: Record<string, { score: number; avgPaymentDays: number; riskLevel: 'low' | 'medium' | 'high' }> = {
  h1: { score: 85, avgPaymentDays: 35, riskLevel: 'low' },
  h2: { score: 72, avgPaymentDays: 45, riskLevel: 'medium' },
  h3: { score: 60, avgPaymentDays: 55, riskLevel: 'high' },
  h4: { score: 90, avgPaymentDays: 28, riskLevel: 'low' },
  h5: { score: 78, avgPaymentDays: 40, riskLevel: 'medium' },
};

export function assessWorkingCapital(params: WorkingCapitalParams): WorkingCapitalDecision {
  const profile = HOTEL_CREDIT_PROFILES[params.hotelId] || { score: 70, avgPaymentDays: 45, riskLevel: 'medium' };
  const baseAdvanceRate = 0.80;
  const creditBonus = (profile.score - 60) * 0.005;
  const advanceRate = Math.min(0.95, baseAdvanceRate + creditBonus);
  const platformFeeRate = 0.02;
  const maxAdvance = params.orderValue * advanceRate;
  const platformFee = maxAdvance * platformFeeRate;
  const supplierPayout = maxAdvance - platformFee;
  const repaymentDate = new Date();
  repaymentDate.setDate(repaymentDate.getDate() + params.paymentTermsDays);

  let approved = true;
  let explanation = `Approved: Hotel credit score ${profile.score}/100, ${profile.riskLevel} risk profile.`;

  if (profile.score < 50) {
    approved = false;
    explanation = `Declined: Hotel credit score ${profile.score}/100 below minimum threshold (50).`;
  } else if (params.orderValue > 500000 && profile.riskLevel !== 'low') {
    approved = false;
    explanation = `Declined: Order value EGP ${params.orderValue.toLocaleString()} exceeds limit for ${profile.riskLevel} risk profile.`;
  }

  return {
    approved,
    maxAdvance: Math.round(maxAdvance),
    advanceRate: Math.round(advanceRate * 100),
    platformFee: Math.round(platformFee),
    supplierPayout: Math.round(supplierPayout),
    hotelRepaymentDate: repaymentDate.toISOString().split('T')[0],
    riskLevel: profile.riskLevel,
    explanation,
  };
}

export function createFactoringApplication(params: WorkingCapitalParams): FactoringApplication {
  const decision = assessWorkingCapital(params);
  return {
    id: `FA-${Date.now()}`,
    hotelId: params.hotelId,
    supplierId: params.supplierId,
    orderId: '',
    invoiceId: '',
    amount: params.orderValue,
    advanceRate: decision.advanceRate,
    platformFee: decision.platformFee,
    status: decision.approved ? 'approved' : 'declined',
    createdAt: new Date().toISOString(),
    repaymentDate: decision.hotelRepaymentDate,
  };
}
