/**
 * AI Financial Analysis Agent for Credit Line Applications
 * Uses Hotels Vendors proprietary scoring engine + Grok 4.1 for narrative synthesis
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeLLM } from "@/lib/ai/llm";
import { HotelScoreEngine } from "@/lib/fintech/scoring/hotel-score-engine";
import { requireServiceKey } from "@/lib/api-utils";

const FINANCIAL_ANALYST_PROMPT = `You are the Hotels Vendors Credit Underwriting AI — an institutional-grade financial analyst specialized in Egyptian hospitality sector credit risk.

Your job: Analyze the provided hotel financial data and produce a rigorous, bank-quality credit assessment.

SCORING FRAMEWORK (Hotels Vendors Proprietary):
- Financial Health (18%): Revenue scale, asset base, runway
- Liquidity Position (18%): Current ratio, quick ratio, cash buffer
- Leverage Profile (12%): Debt ratios, payment discipline
- Profitability (12%): Margins, ROA, asset turnover
- Collateral Strength (10%): Property deeds, guarantees, deposits
- Market Position (12%): Brand strength, scale, location quality
- Platform Behavior (10%): Payment history, order volume (if available)
- Sector Risk (8%): Inflation, payment delay trends, seasonality

OUTPUT FORMAT — JSON:
{
  "report": "Detailed 3-paragraph narrative assessment...",
  "riskFlags": [
    { "severity": "RED|AMBER|GREEN", "category": "LIQUIDITY|LEVERAGE|PROFITABILITY|COLLATERAL|MARKET", "description": "...", "mitigation": "..." }
  ],
  "recommendedLimit": 500000, // EGP
  "creditScore": 650, // 0-1000 Hotels Vendors scale
  "grade": "BBB", // AAA to D
  "riskLevel": "MEDIUM", // LOW, MEDIUM, HIGH, VERY_HIGH
  "maxTenorDays": 60,
  "factoringFee": 4.5, // %
  "approvalProbability": 75, // 0-100
  "peerComparison": "Above average among Egyptian hospitality groups",
  "trendDirection": "STABLE|IMPROVING|DECLINING",
  "keyRisks": ["..."],
  "mitigationSuggestions": ["..."]
}`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireServiceKey(request);
    const { id } = await params;
    
    const app = await prisma.creditLineApplication.findUnique({
      where: { id },
    });
    if (!app) {
      return Response.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    // Update status to AI_ANALYZING
    await prisma.creditLineApplication.update({
      where: { id },
      data: { status: "AI_ANALYZING" },
    });

    // ── STEP 1: Run proprietary scoring engine ────────────────────
    const financials = {
      annualRevenue: Number(app.annualRevenue || 0),
      netProfit: Number(app.netProfit || 0),
      totalAssets: Number(app.totalAssets || 0),
      currentAssets: Number(app.currentAssets || 0),
      totalLiabilities: Number(app.totalLiabilities || 0),
      currentLiabilities: Number(app.currentLiabilities || 0),
      bankBalance: Number(app.bankBalance || 0),
      monthlyPurchases: Number(app.monthlyPurchases || 0),
      avgPaymentDays: Number(app.avgPaymentDays || 0),
      existingDebt: Number(app.existingDebt || 0),
    };

    const profile = {
      properties: app.properties || 1,
      rooms: app.rooms || 0,
      governorate: app.governorate || "Unknown",
      brand: app.brand,
      yearsInOperation: 5, // Default — would be from application
    };

    const collateral = {
      propertyDeed: app.propertyDeed,
      bankGuarantee: app.bankGuarantee,
      personalGuarantee: app.personalGuarantee,
      equipmentCollateral: app.equipmentCollateral,
      depositAmount: Number(app.depositAmount || 0),
    };

    const market = {
      sectorInflation: 12,
      avgPaymentDelayTrend: 5,
      tourismOccupancyRate: 65,
      seasonalFactor: 1.0,
    };

    const engineScore = HotelScoreEngine.calculateScore(financials, profile, collateral, market);

    // ── STEP 2: Build financial prompt for AI narrative synthesis ──
    const financialPrompt = `HOTEL: ${app.hotelName}
BRAND: ${app.brand || "Independent"}
PROPERTIES: ${app.properties || 1} | ROOMS: ${app.rooms || "N/A"}
LOCATION: ${app.governorate || "Unknown"}

FINANCIAL SNAPSHOT:
- Annual Revenue: EGP ${Number(app.annualRevenue || 0).toLocaleString()}
- Net Profit: EGP ${Number(app.netProfit || 0).toLocaleString()} (${app.annualRevenue ? ((Number(app.netProfit || 0)) / Number(app.annualRevenue) * 100).toFixed(1) : "N/A"}% margin)
- Total Assets: EGP ${Number(app.totalAssets || 0).toLocaleString()}
- Total Liabilities: EGP ${Number(app.totalLiabilities || 0).toLocaleString()}
- Current Ratio: ${Number(app.currentLiabilities || 0) > 0 ? ((Number(app.currentAssets || 0)) / (Number(app.currentLiabilities || 1))).toFixed(2) : "N/A"}
- Bank Balance: EGP ${Number(app.bankBalance || 0).toLocaleString()}
- Monthly Purchases: EGP ${Number(app.monthlyPurchases || 0).toLocaleString()}
- Average Payment Days: ${app.avgPaymentDays || "N/A"}
- Existing Debt: EGP ${Number(app.existingDebt || 0).toLocaleString()}

COLLATERAL:
- Property Deed: ${app.propertyDeed ? "YES" : "NO"}
- Bank Guarantee: ${app.bankGuarantee ? "YES" : "NO"}
- Personal Guarantee: ${app.personalGuarantee ? "YES" : "NO"}
- Equipment Collateral: ${app.equipmentCollateral ? "YES" : "NO"}
- Cash Deposit: EGP ${(app.depositAmount || 0).toLocaleString()}

PROPRIETARY ENGINE SCORE: ${engineScore.overallScore}/1000
GRADE: ${engineScore.grade} | RISK: ${engineScore.riskLevel}
RECOMMENDED LIMIT: EGP ${engineScore.recommendedLimit.toLocaleString()}
MAX TENOR: ${engineScore.maxTenorDays} days | FACTORING FEE: ${engineScore.factoringFee}%

COMPONENT SCORES:
- Financial Health: ${engineScore.financialHealth}/100
- Liquidity: ${engineScore.liquidityPosition}/100
- Leverage: ${engineScore.leverageProfile}/100
- Profitability: ${engineScore.profitability}/100
- Collateral: ${engineScore.collateralStrength}/100
- Market Position: ${engineScore.marketPosition}/100
- Sector Risk: ${engineScore.sectorRisk}/100

Use the engine scores as your baseline. Your task is to write the narrative report and validate/refine the risk flags.`;

    // ── STEP 3: Call Grok 4.1 for narrative synthesis ──────────────
    let aiResult: Record<string, unknown>;
    try {
      const llmResult = await executeLLM(FINANCIAL_ANALYST_PROMPT, financialPrompt, {
        temperature: 0.2,
        maxTokens: 3000,
      });
      aiResult = JSON.parse(llmResult.content.replace(/```json?\s*|```/g, "").trim());
    } catch (llmError) {
      // Fallback to engine scores if AI fails
      aiResult = {
        report: `Credit analysis for ${app.hotelName} completed using Hotels Vendors proprietary scoring engine. Overall score: ${engineScore.overallScore}/1000 (${engineScore.grade}). ${engineScore.riskLevel === "LOW" ? "Low risk profile recommended for standard terms." : engineScore.riskLevel === "MEDIUM" ? "Moderate risk — recommend standard terms with monitoring." : "Elevated risk — recommend enhanced due diligence and collateral requirements."}`,
        riskFlags: engineScore.redFlags.map((f) => ({ severity: "RED", category: "GENERAL", description: f, mitigation: "Review with underwriting team" })).concat(
          engineScore.amberFlags.map((f) => ({ severity: "AMBER", category: "GENERAL", description: f, mitigation: "Monitor closely" }))
        ),
        recommendedLimit: engineScore.recommendedLimit,
        creditScore: engineScore.overallScore,
        grade: engineScore.grade,
        riskLevel: engineScore.riskLevel,
        maxTenorDays: engineScore.maxTenorDays,
        factoringFee: engineScore.factoringFee,
        approvalProbability: engineScore.approvalProbability,
        peerComparison: engineScore.peerComparison,
        trendDirection: engineScore.trendDirection,
        keyRisks: engineScore.keyRisks,
        mitigationSuggestions: engineScore.mitigationSuggestions,
      };
    }

    // ── STEP 4: Merge engine scores with AI narrative ──────────────
    const finalScore = Number(aiResult.creditScore) || engineScore.overallScore;
    const finalLimit = Number(aiResult.recommendedLimit) || engineScore.recommendedLimit;
    const finalGrade = (aiResult.grade as string) || engineScore.grade;

    // ── STEP 5: Persist results ────────────────────────────────────
    const updated = await prisma.creditLineApplication.update({
      where: { id },
      data: {
        status: "FACTORING_REVIEW",
        creditScore: finalScore,
        recommendedLimit: finalLimit,
        aiAnalysisReport: JSON.stringify({
          report: aiResult.report,
          riskFlags: aiResult.riskFlags,
          peerComparison: aiResult.peerComparison,
          trendDirection: aiResult.trendDirection,
          keyRisks: aiResult.keyRisks,
          mitigationSuggestions: aiResult.mitigationSuggestions,
          engineScores: {
            financialHealth: engineScore.financialHealth,
            liquidityPosition: engineScore.liquidityPosition,
            leverageProfile: engineScore.leverageProfile,
            profitability: engineScore.profitability,
            collateralStrength: engineScore.collateralStrength,
            marketPosition: engineScore.marketPosition,
            sectorRisk: engineScore.sectorRisk,
          },
        }),
        aiRiskFlags: JSON.stringify({
          redFlags: engineScore.redFlags,
          amberFlags: engineScore.amberFlags,
          greenFlags: engineScore.greenFlags,
        }),
      },
    });

    return Response.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        creditScore: updated.creditScore,
        grade: finalGrade,
        recommendedLimit: updated.recommendedLimit,
        riskLevel: aiResult.riskLevel || engineScore.riskLevel,
        approvalProbability: aiResult.approvalProbability || engineScore.approvalProbability,
        maxTenorDays: aiResult.maxTenorDays || engineScore.maxTenorDays,
        factoringFee: aiResult.factoringFee || engineScore.factoringFee,
        analysis: aiResult.report,
        riskFlags: aiResult.riskFlags,
        keyRisks: aiResult.keyRisks,
        mitigationSuggestions: aiResult.mitigationSuggestions,
      },
    });
  } catch (error) {
    console.error("Credit analysis error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
