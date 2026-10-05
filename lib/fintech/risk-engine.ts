import {rejectNativeFunding} from "./external-only";
export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskScoreFactors {
  paymentHistoryScore: number; // 0-100 (30% weight)
  creditUtilizationScore: number; // 0-100 (20% weight)
  disputeRateScore: number; // 0-100 (15% weight)
  etaComplianceScore: number; // 0-100 (15% weight)
  scaleScore: number; // 0-100 (10% weight)
  reputationScore: number; // 0-100 (10% weight)
}

export interface RiskAssessment {
  hotelId: string;
  compositeScore: number; // 0-100 (lower = better)
  riskTier: RiskTier;
  factors: RiskScoreFactors;
  creditAvailable: number;
  creditLimit: number;
  creditUsed: number;
  totalExposure: number;
  assessedAt: Date;
}

export type SmartFixType = "DEPOSIT_20" | "HIGH_RISK_FACTORING" | "SPLIT_50_50" | "AUTO_LIMIT_EXTENSION" | "FACTORING_STANDARD";

export interface SmartFix {
  type: SmartFixType;
  title: string;
  description: string;
  action: "HOLD_ORDER" | "ROUTE_PARTNER" | "SPLIT_PAYMENT" | "EXTEND_LIMIT" | "APPLY_FACTORING";
  orderId: string;
  hotelId: string;
  hotelRiskTier: RiskTier;
  
  // Fix-specific payload
  payload: DepositFixPayload | HighRiskFactoringPayload | SplitPaymentPayload | AutoLimitExtensionPayload | StandardFactoringPayload;
  
  // UI metadata
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedResolutionMinutes: number;
  requiresHotelAcceptance: boolean;
}

export interface DepositFixPayload {
  depositAmount: number;
  depositPercentage: number;
  gateway: "PAYMOB";
  releaseCondition: "DEPOSIT_RECEIVED";
  paymobOrderId?: string;
  paymentLink?: string;
}

export interface HighRiskFactoringPayload {
  partnerTier: "HIGH_RISK";
  eligiblePartners: string[];
  adjustedDiscountRate: number; // e.g. 0.03 = 3%
  advanceRate: number; // e.g. 0.85
  explanation: string;
}

export interface SplitPaymentPayload {
  deliveryAmount: number;
  creditAmount: number;
  deliveryPercentage: number;
  creditPercentage: number;
  creditTermsDays: number;
  factoringEligibleForCreditPortion: boolean;
}

export interface AutoLimitExtensionPayload {
  currentLimit: number;
  extensionAmount: number;
  newLimit: number;
  reason: string;
  requiresApproval: boolean;
}

export interface StandardFactoringPayload {
  advanceRate: number; // e.g. 0.90
  discountRate: number; // e.g. 0.02
  estimatedDisbursement: number;
  explanation: string;
}


export interface RiskHeatmapData {
  hotelId: string;
  hotelName: string;
  city: string;
  governorate: string;
  riskScore: number;
  riskTier: RiskTier;
  creditLimit: number;
  creditUsed: number;
  totalExposure: number;
  propertyCount: number;
  roomCount: number;
}

/**
 * Generate data for the admin Credit Heatmap dashboard.
 */

export interface LiquidityMonitorData {
  totalDeployedToday: number;
  totalDeployedThisWeek: number;
  totalDeployedThisMonth: number;
  activeRequests: number;
  disbursementVelocity: number; // EGP per hour
  defaultRate: number; // Percentage
  platformRevenueYTD: number;
  partnerBreakdown: {
    partnerId: string;
    partnerName: string;
    deployed: number;
    activeRequests: number;
    defaultRate: number;
  }[];
}

/**
 * Generate data for the admin Liquidity Monitor dashboard.
 */

export async function assessRisk(_hotelId:string,_tenantId?:string):Promise<RiskAssessment>{return rejectNativeFunding()}
export async function generateSmartFixes(_orderId:string,_hotelId:string,_orderTotal:number,_tenantId?:string):Promise<SmartFix[]>{return rejectNativeFunding()}
export async function getRiskHeatmapData(_tenantId?:string):Promise<RiskHeatmapData[]>{return rejectNativeFunding()}
export async function getLiquidityMonitorData():Promise<LiquidityMonitorData>{return rejectNativeFunding()}
