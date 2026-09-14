/**
 * Hotels Vendors Proprietary Credit Scoring Engine
 * Purpose-built for Egyptian hospitality sector
 * Combines financial ratios, market intelligence, payment behavior, and sector-specific risk factors
 */

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

export class HotelScoreEngine {
  /**
   * Main scoring function — combines all factors into Hotels Vendors proprietary score
   */
  static calculateScore(
    financials: HotelFinancials,
    profile: HotelProfile,
    collateral: Collateral,
    market: MarketContext,
    history?: PlatformHistory
  ): HotelCreditScore {
    const scores = {
      financialHealth: this.scoreFinancialHealth(financials),
      liquidityPosition: this.scoreLiquidity(financials),
      leverageProfile: this.scoreLeverage(financials),
      profitability: this.scoreProfitability(financials),
      collateralStrength: this.scoreCollateral(collateral, financials),
      marketPosition: this.scoreMarketPosition(profile, market),
      platformBehavior: history ? this.scorePlatformBehavior(history) : 50,
      sectorRisk: this.scoreSectorRisk(market, profile),
    };

    // Weighted composite (Hotels Vendors proprietary weights)
    const weights = {
      financialHealth: 0.18,
      liquidityPosition: 0.18,
      leverageProfile: 0.12,
      profitability: 0.12,
      collateralStrength: 0.10,
      marketPosition: 0.12,
      platformBehavior: 0.10,
      sectorRisk: 0.08,
    };

    const weightedSum = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + scores[key as keyof typeof scores] * weight,
      0
    );

    // Scale to 0-1000
    const overallScore = Math.round(weightedSum * 10);
    const grade = this.scoreToGrade(overallScore);
    const riskLevel = this.scoreToRisk(overallScore);

    const flags = this.generateFlags(financials, collateral, market, scores);
    const limit = this.calculateLimit(financials, overallScore, collateral);
    const tenor = this.calculateTenor(overallScore, market);
    const fee = this.calculateFactoringFee(overallScore, market);

    return {
      overallScore,
      grade,
      recommendedLimit: limit,
      maxTenorDays: tenor,
      factoringFee: fee,
      riskLevel,
      approvalProbability: this.calculateApprovalProbability(overallScore, flags.redFlags.length),
      ...scores,
      ...flags,
      peerComparison: this.generatePeerComparison(scores),
      trendDirection: this.detectTrend(financials, history),
      keyRisks: flags.redFlags.concat(flags.amberFlags).slice(0, 5),
      mitigationSuggestions: this.generateMitigations(flags.redFlags, flags.amberFlags),
    };
  }

  // ── Individual Scoring Functions ─────────────────────────────

  private static scoreFinancialHealth(f: HotelFinancials): number {
    let score = 50;
    const revenue = f.annualRevenue;
    
    if (revenue >= 50_000_000) score += 25;
    else if (revenue >= 20_000_000) score += 20;
    else if (revenue >= 10_000_000) score += 15;
    else if (revenue >= 5_000_000) score += 10;
    else score += 5;

    // Revenue consistency (bank balance vs revenue)
    const runway = revenue > 0 ? f.bankBalance / (revenue / 12) : 0;
    if (runway >= 6) score += 15;
    else if (runway >= 3) score += 10;
    else if (runway >= 1) score += 5;
    else score -= 10;

    // Asset base
    if (f.totalAssets >= revenue * 1.5) score += 10;
    else if (f.totalAssets >= revenue) score += 5;
    else score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  private static scoreLiquidity(f: HotelFinancials): number {
    let score = 50;
    const currentRatio = f.currentLiabilities > 0 ? f.currentAssets / f.currentLiabilities : 0;
    const quickRatio = f.currentLiabilities > 0 ? (f.currentAssets - f.monthlyPurchases * 0.5) / f.currentLiabilities : 0;

    if (currentRatio >= 2) score += 25;
    else if (currentRatio >= 1.5) score += 20;
    else if (currentRatio >= 1) score += 10;
    else score -= 15;

    if (quickRatio >= 1.5) score += 15;
    else if (quickRatio >= 1) score += 10;
    else if (quickRatio >= 0.5) score += 5;
    else score -= 10;

    // Cash buffer
    const monthlyBurn = f.monthlyPurchases + Math.abs(Math.min(0, f.netProfit / 12));
    const cashMonths = monthlyBurn > 0 ? f.bankBalance / monthlyBurn : 0;
    if (cashMonths >= 4) score += 10;
    else if (cashMonths >= 2) score += 5;
    else score -= 10;

    return Math.min(100, Math.max(0, score));
  }

  private static scoreLeverage(f: HotelFinancials): number {
    let score = 50;
    const debtToAssets = f.totalAssets > 0 ? f.existingDebt / f.totalAssets : 0;
    const debtToEquity = f.totalAssets > f.totalLiabilities ? f.existingDebt / (f.totalAssets - f.totalLiabilities) : 0;

    if (debtToAssets <= 0.3) score += 25;
    else if (debtToAssets <= 0.5) score += 15;
    else if (debtToAssets <= 0.7) score += 5;
    else score -= 15;

    if (debtToEquity <= 0.5) score += 15;
    else if (debtToEquity <= 1) score += 5;
    else score -= 10;

    // Payment discipline
    if (f.avgPaymentDays <= 30) score += 10;
    else if (f.avgPaymentDays <= 45) score += 5;
    else if (f.avgPaymentDays <= 60) score += 0;
    else score -= 10;

    return Math.min(100, Math.max(0, score));
  }

  private static scoreProfitability(f: HotelFinancials): number {
    let score = 50;
    const margin = f.annualRevenue > 0 ? f.netProfit / f.annualRevenue : 0;
    const assetTurnover = f.totalAssets > 0 ? f.annualRevenue / f.totalAssets : 0;
    const roa = f.totalAssets > 0 ? f.netProfit / f.totalAssets : 0;

    if (margin >= 0.2) score += 25;
    else if (margin >= 0.15) score += 20;
    else if (margin >= 0.1) score += 15;
    else if (margin >= 0.05) score += 5;
    else score -= 15;

    if (assetTurnover >= 1.5) score += 10;
    else if (assetTurnover >= 1) score += 5;
    else score -= 5;

    if (roa >= 0.1) score += 10;
    else if (roa >= 0.05) score += 5;
    else score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  private static scoreCollateral(c: Collateral, f: HotelFinancials): number {
    let score = 30;
    if (c.propertyDeed) score += 30;
    if (c.bankGuarantee) score += 20;
    if (c.personalGuarantee) score += 15;
    if (c.equipmentCollateral) score += 10;

    const depositRatio = f.annualRevenue > 0 ? (c.depositAmount || 0) / (f.annualRevenue * 0.1) : 0;
    if (depositRatio >= 1) score += 15;
    else if (depositRatio >= 0.5) score += 10;
    else if (depositRatio > 0) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private static scoreMarketPosition(p: HotelProfile, m: MarketContext): number {
    let score = 50;

    // Scale matters in hospitality
    if (p.properties >= 10) score += 15;
    else if (p.properties >= 5) score += 10;
    else if (p.properties >= 2) score += 5;

    if (p.rooms >= 500) score += 10;
    else if (p.rooms >= 200) score += 5;

    // Brand strength
    const strongBrands = ["marriott", "hilton", "accor", "hyatt", "intercontinental", "four seasons", "steigenberger", "movenpick", "jaz"];
    if (p.brand && strongBrands.some((b) => p.brand?.toLowerCase().includes(b))) score += 15;
    else if (p.brand) score += 5;

    // Location quality
    const primeLocations = ["cairo", "giza", "red sea", "hurghada", "sharm", "alexandria", "north coast"];
    if (primeLocations.some((l) => p.governorate.toLowerCase().includes(l))) score += 10;

    // Tourism occupancy
    if (m.tourismOccupancyRate >= 70) score += 10;
    else if (m.tourismOccupancyRate >= 50) score += 5;
    else score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  private static scorePlatformBehavior(h: PlatformHistory): number {
    let score = 50;

    if (h.onTimePaymentRate >= 95) score += 25;
    else if (h.onTimePaymentRate >= 85) score += 15;
    else if (h.onTimePaymentRate >= 70) score += 5;
    else score -= 15;

    if (h.disputeRate <= 2) score += 15;
    else if (h.disputeRate <= 5) score += 5;
    else score -= 10;

    if (h.relationshipMonths >= 12) score += 10;
    else if (h.relationshipMonths >= 6) score += 5;

    if (h.totalSpend >= 10_000_000) score += 10;
    else if (h.totalSpend >= 5_000_000) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private static scoreSectorRisk(m: MarketContext, p: HotelProfile): number {
    let score = 50;

    // Inflation impact
    if (m.sectorInflation <= 5) score += 15;
    else if (m.sectorInflation <= 10) score += 5;
    else if (m.sectorInflation <= 15) score -= 5;
    else score -= 15;

    // Payment delay trend
    if (m.avgPaymentDelayTrend <= 0) score += 15;
    else if (m.avgPaymentDelayTrend <= 5) score += 5;
    else if (m.avgPaymentDelayTrend <= 10) score -= 5;
    else score -= 15;

    // Seasonal factor
    if (m.seasonalFactor >= 1.2) score += 10;
    else if (m.seasonalFactor >= 0.9) score += 5;
    else score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  // ── Helpers ──────────────────────────────────────────────────

  private static scoreToGrade(score: number): HotelCreditScore["grade"] {
    if (score >= 900) return "AAA";
    if (score >= 800) return "AA";
    if (score >= 700) return "A";
    if (score >= 600) return "BBB";
    if (score >= 500) return "BB";
    if (score >= 400) return "B";
    if (score >= 300) return "CCC";
    return "D";
  }

  private static scoreToRisk(score: number): HotelCreditScore["riskLevel"] {
    if (score >= 700) return "LOW";
    if (score >= 500) return "MEDIUM";
    if (score >= 300) return "HIGH";
    return "VERY_HIGH";
  }

  private static calculateLimit(f: HotelFinancials, score: number, c: Collateral): number {
    const monthlyPurch = f.monthlyPurchases || f.annualRevenue * 0.3 / 12;
    const base = monthlyPurch * (score >= 800 ? 3 : score >= 600 ? 2 : score >= 400 ? 1 : 0.5);
    
    // Cap at 10% of revenue
    const cap = f.annualRevenue * 0.1;
    
    // Collateral boost
    let collateralBoost = 1;
    if (c.propertyDeed) collateralBoost += 0.3;
    if (c.bankGuarantee) collateralBoost += 0.2;
    if (c.personalGuarantee) collateralBoost += 0.1;
    if (c.depositAmount) collateralBoost += Math.min(0.2, (c.depositAmount / Math.max(base, 1)) * 0.5);
    
    return Math.min(base * collateralBoost, cap);
  }

  private static calculateTenor(score: number, m: MarketContext): number {
    const baseTenor = score >= 800 ? 90 : score >= 600 ? 60 : score >= 400 ? 45 : 30;
    if (m.seasonalFactor < 0.8) return Math.max(30, baseTenor - 15); // Low season = shorter tenor
    return baseTenor;
  }

  private static calculateFactoringFee(score: number, m: MarketContext): number {
    const baseFee = score >= 800 ? 3.0 : score >= 600 ? 4.0 : score >= 400 ? 5.0 : 6.5;
    const marketAdj = m.sectorInflation > 10 ? 0.5 : m.sectorInflation > 5 ? 0.25 : 0;
    return Math.min(8, baseFee + marketAdj);
  }

  private static calculateApprovalProbability(score: number, redFlags: number): number {
    let prob = score / 10;
    prob -= redFlags * 15;
    return Math.max(0, Math.min(100, prob));
  }

  private static generateFlags(
    f: HotelFinancials,
    c: Collateral,
    m: MarketContext,
    scores: Record<string, number>
  ): { redFlags: string[]; amberFlags: string[]; greenFlags: string[] } {
    const red: string[] = [];
    const amber: string[] = [];
    const green: string[] = [];

    if (scores.liquidityPosition < 40) red.push("Critical liquidity shortage");
    if (scores.leverageProfile < 30) red.push("Excessive debt burden");
    if (f.avgPaymentDays > 90) red.push("History of severely delayed payments");
    if (!c.propertyDeed && !c.bankGuarantee && !c.personalGuarantee) red.push("No collateral or guarantees");
    if (f.bankBalance < f.monthlyPurchases) red.push("Insufficient cash to cover one month of procurement");

    if (scores.profitability < 40) amber.push("Thin profit margins");
    if (scores.financialHealth < 50) amber.push("Weak revenue base relative to sector");
    if (m.sectorInflation > 15) amber.push("High inflation environment increasing input costs");
    if (f.existingDebt > f.annualRevenue * 0.5) amber.push("Debt exceeds 50% of annual revenue");
    if (!c.propertyDeed && !c.bankGuarantee) amber.push("Limited collateral coverage");

    if (scores.financialHealth >= 70) green.push("Strong revenue base");
    if (scores.liquidityPosition >= 70) green.push("Healthy liquidity position");
    if (scores.profitability >= 60) green.push("Healthy profit margins");
    if (f.avgPaymentDays <= 30) green.push("Excellent payment discipline");
    if (c.propertyDeed) green.push("Property collateral secured");
    if (scores.platformBehavior >= 70) green.push("Strong platform relationship history");

    return { redFlags: red, amberFlags: amber, greenFlags: green };
  }

  private static generatePeerComparison(scores: Record<string, number>): string {
    const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    if (avg >= 75) return "Top quartile among Egyptian hospitality groups";
    if (avg >= 60) return "Above average among Egyptian hospitality groups";
    if (avg >= 45) return "Average among Egyptian hospitality groups";
    return "Below average — requires monitoring";
  }

  private static detectTrend(f: HotelFinancials, h?: PlatformHistory): HotelCreditScore["trendDirection"] {
    if (!h) return "STABLE";
    if (h.onTimePaymentRate >= 90 && h.totalOrders > 10) return "IMPROVING";
    if (h.disputeRate > 5 || h.onTimePaymentRate < 70) return "DECLINING";
    return "STABLE";
  }

  private static generateMitigations(reds: string[], ambers: string[]): string[] {
    const mitigations: string[] = [];
    
    if (reds.some((r) => r.includes("liquidity"))) {
      mitigations.push("Require bank guarantee or cash deposit of 10% of limit");
    }
    if (reds.some((r) => r.includes("debt"))) {
      mitigations.push("Cap facility at 5% of annual revenue until debt-to-assets below 50%");
    }
    if (ambers.some((r) => r.includes("inflation"))) {
      mitigations.push("Shorten tenor to 30 days during high inflation periods");
    }
    if (!mitigations.length) {
      mitigations.push("Standard terms approved");
    }
    
    return mitigations;
  }
}

// ── Export convenience function ────────────────────────────────

export function calculateHotelCreditScore(
  financials: HotelFinancials,
  profile: HotelProfile,
  collateral: Collateral,
  market: MarketContext,
  history?: PlatformHistory
): HotelCreditScore {
  return HotelScoreEngine.calculateScore(financials, profile, collateral, market, history);
}
