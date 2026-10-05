import {rejectNativeFunding} from "../external-only";
interface HotelFinancials {
  annualRevenue: number;
  netProfit: number;
  totalAssets: number;
  currentAssets: number;
  totalLiabilities: number;
  currentLiabilities: number;
  bankBalance: number;
  monthlyPurchases: number;
  avgPaymentDays: number;
  existingDebt: number;
}

interface HotelProfile {
  properties: number;
  rooms: number;
  governorate: string;
  brand: string | null;
  yearsInOperation: number;
}

interface Collateral {
  propertyDeed: boolean;
  bankGuarantee: boolean;
  personalGuarantee: boolean;
  equipmentCollateral: boolean;
  depositAmount: number;
}

interface MarketContext {
  sectorInflation: number; // Monthly price change %
  avgPaymentDelayTrend: number; // Days change vs last quarter
  tourismOccupancyRate: number; // Current occupancy %
  seasonalFactor: number; // 0.5-1.5 multiplier
}

interface PlatformHistory {
  totalOrders: number;
  totalSpend: number;
  avgOrderValue: number;
  onTimePaymentRate: number;
  disputeRate: number;
  relationshipMonths: number;
}

export interface HotelCreditScore {
  overallScore: number; // 0-1000 (Hotels Vendors scale)
  grade: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "D";
  recommendedLimit: number;
  maxTenorDays: number;
  factoringFee: number; // %
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  approvalProbability: number; // 0-100
  
  // Component scores
  financialHealth: number; // 0-100
  liquidityPosition: number; // 0-100
  leverageProfile: number; // 0-100
  profitability: number; // 0-100
  collateralStrength: number; // 0-100
  marketPosition: number; // 0-100
  platformBehavior: number; // 0-100
  sectorRisk: number; // 0-100
  
  // Flags
  redFlags: string[];
  amberFlags: string[];
  greenFlags: string[];
  
  // Analysis
  peerComparison: string;
  trendDirection: "IMPROVING" | "STABLE" | "DECLINING";
  keyRisks: string[];
  mitigationSuggestions: string[];
}

export class HotelScoreEngine {static calculateScore(_financials:HotelFinancials,_profile:HotelProfile,_collateral:Collateral,_market:MarketContext,_history?:PlatformHistory):HotelCreditScore{return rejectNativeFunding()}}
export const calculateHotelCreditScore=HotelScoreEngine.calculateScore;
