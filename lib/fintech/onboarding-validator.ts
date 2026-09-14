/**
 * lib/fintech/onboarding-validator.ts
 *
 * The Fintech Validator — a pure decision engine for the agentic onboarding flow.
 */

export type ValidatorRole = "HOTEL" | "SUPPLIER" | "FACTORING" | "LOGISTICS";

export type FundingIntent =
  | "FINANCING"
  | "INTEGRATE"
  | "ALREADY_ON_OLIV"
  | "MARKETPLACE";

export interface ValidationResult {
  olivObligation: "MANDATORY" | "OPTIONAL" | "NOT_REQUIRED" | "LINK_EXISTING";
  advice: string;
  olivAction: string;
  alternative: string;
  requiredFields: string[];
  nextStep: string;
  cta: string;
  redirectKey: "OLIV_APP" | "ERP_INTEGRATION" | "LINK_OLIV" | "MARKETPLACE";
}

const APP = "https://hotelsvendors.com/hovin";
const OLIV_URL = "https://apps.apple.com/app/oliv" + "?referral=CHV000";

const R = {
  HOTEL: "HOTEL",
  SUPPLIER: "SUPPLIER",
  FACTORING: "FACTORING",
  LOGISTICS: "LOGISTICS",
} as const;

const I = {
  FINANCING: "FINANCING",
  INTEGRATE: "INTEGRATE",
  ALREADY_ON_OLIV: "ALREADY_ON_OLIV",
  MARKETPLACE: "MARKETPLACE",
} as const;

const MATRIX: Record<ValidatorRole, Partial<Record<FundingIntent, ValidationResult>>> = {
  [R.HOTEL]: {
    [I.FINANCING]: {
      olivObligation: "MANDATORY",
      advice: "Recommended: apply for an Oliv credit line (up to EGP 10M) with Net-60 payment terms.",
      olivAction: "Download Oliv Fintech app + CHV000 subscription.",
      alternative: "Integrate your existing ERP/PMS and keep your current cash-flow arrangement.",
      requiredFields: ["Hotel Name", "Tax ID", "ETA Registration Number", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Oliv app download → connect ETA token → start procuring",
      cta: "Continue to Oliv Financing",
      redirectKey: "OLIV_APP",
    },
    [I.INTEGRATE]: {
      olivObligation: "OPTIONAL",
      advice: "Integrate HotelsVendors with your ERP/PMS via bi-directional sync.",
      olivAction: "Oliv financing optional later (CHV000).",
      alternative: "Native ETA e-invoicing, authority-matrix approvals, AI demand forecasting.",
      requiredFields: ["Hotel Name", "ERP system", "Tax ID", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "ERP sync → connect ETA token → start procuring",
      cta: "Continue to ERP Integration",
      redirectKey: "ERP_INTEGRATION",
    },
    [I.ALREADY_ON_OLIV]: {
      olivObligation: "LINK_EXISTING",
      advice: "Link your existing Oliv credit facility — no re-application needed.",
      olivAction: "Pair your Oliv account with our platform (CHV000 network).",
      alternative: "ETA e-invoicing, multi-property approvals, AI spend forecasting on top of your liquidity.",
      requiredFields: ["Hotel Name", "Oliv Account / Facility ID", "Tax ID", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Link Oliv facility → connect ETA token → start procuring",
      cta: "Link My Oliv Account",
      redirectKey: "LINK_OLIV",
    },
    [I.MARKETPLACE]: {
      olivObligation: "NOT_REQUIRED",
      advice: "Browse 500+ verified suppliers with fixed prices and compare across vendors.",
      olivAction: "Financing available as optional add-on (Oliv, CHV000) for Net-60 terms.",
      alternative: "Transparent fixed pricing, cross-supplier comparison, ETA-compliant invoices, 48h delivery.",
      requiredFields: ["Hotel Name", "Tax ID", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Set up procurement workspace → start sourcing",
      cta: "Continue to Sourcing",
      redirectKey: "MARKETPLACE",
    },
  },
  [R.SUPPLIER]: {
    [I.FINANCING]: {
      olivObligation: "MANDATORY",
      advice: "Get 48-hour early cash-out on approved orders via Oliv reverse factoring.",
      olivAction: "Download Oliv Fintech app + CHV000 payout subscription.",
      alternative: "List on marketplace, get paid on hotel payment cycles.",
      requiredFields: ["Company Name", "Commercial Register", "Tax ID", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Oliv subscription → upload catalog → accept orders → 48h cash-out",
      cta: "Continue to 48h Cash-Out",
      redirectKey: "OLIV_APP",
    },
    [I.INTEGRATE]: {
      olivObligation: "OPTIONAL",
      advice: "Connect via price-list upload, CSV, or webhook/ERP sync.",
      olivAction: "48h cash-out via Oliv optional later (CHV000).",
      alternative: "Direct hotel purchase orders, ETA-compliant invoicing, status-tracking in one inbox.",
      requiredFields: ["Company Name", "Commercial Register", "Tax ID", "Catalog format", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Catalog/ERP sync setup → accept orders",
      cta: "Continue to Catalog Sync",
      redirectKey: "ERP_INTEGRATION",
    },
    [I.ALREADY_ON_OLIV]: {
      olivObligation: "LINK_EXISTING",
      advice: "Link your existing payout account for 48h cash-out without re-onboarding.",
      olivAction: "Pair your Oliv payout account (CHV000 network).",
      alternative: "Direct hotel orders + ETA-compliant invoicing on top of existing payout flow.",
      requiredFields: ["Company Name", "Oliv Account / Payout ID", "Tax ID", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Link Oliv payout → upload catalog → accept orders",
      cta: "Link My Oliv Account",
      redirectKey: "LINK_OLIV",
    },
    [I.MARKETPLACE]: {
      olivObligation: "NOT_REQUIRED",
      advice: "List your catalog, get direct hotel purchase orders with 0% subscription.",
      olivAction: "48h cash-out available as optional add-on (Oliv, CHV000).",
      alternative: "0% platform subscription, live hotel order inbox, ETA-compliant invoicing.",
      requiredFields: ["Company Name", "Commercial Register", "Tax ID", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Upload catalog → accept orders → get paid",
      cta: "Continue to Marketplace",
      redirectKey: "MARKETPLACE",
    },
  },
  [R.FACTORING]: {
    [I.FINANCING]: {
      olivObligation: "OPTIONAL",
      advice: "Explore how our reverse-factoring rails align with your credit appetite.",
      olivAction: "Coordinate with Oliv Capital for facility/portfolio placement (CHV000).",
      alternative: "FRA-regulated factoring rails, live invoice flows, risk-graded portfolios.",
      requiredFields: ["Company Name", "Commercial Register", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Partner onboarding → review live receivable pipelines",
      cta: "Continue as Factoring Partner",
      redirectKey: "MARKETPLACE",
    },
    [I.INTEGRATE]: {
      olivObligation: "OPTIONAL",
      advice: "Integrate your credit/underwriting systems with our invoice flow via API/webhook.",
      olivAction: "Oliv Capital coordination available as option (CHV000).",
      alternative: "Real-time invoice and payment-rail visibility for risk decisioning.",
      requiredFields: ["Company Name", "System/API", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "API/webhook integration → live pipeline visibility",
      cta: "Continue to Integration",
      redirectKey: "ERP_INTEGRATION",
    },
    [I.ALREADY_ON_OLIV]: {
      olivObligation: "LINK_EXISTING",
      advice: "Link your partner account to unlock invoice-pool access on both sides.",
      olivAction: "Pair your Oliv partner account (CHV000 network).",
      alternative: "Access to live, FRA-compliant invoice pipelines.",
      requiredFields: ["Company Name", "Oliv Partner / Facility ID", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Link Oliv partner account → review portfolios",
      cta: "Link My Oliv Account",
      redirectKey: "LINK_OLIV",
    },
    [I.MARKETPLACE]: {
      olivObligation: "NOT_REQUIRED",
      advice: "Review the platform's factoring demand and decide what to fund.",
      olivAction: "Factoring/portfolio participation available as you build appetite.",
      alternative: "Visibility into live hotel-supplier receivable demand.",
      requiredFields: ["Company Name", "Commercial Register", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Review demand → choose how to participate",
      cta: "Continue to Portfolio View",
      redirectKey: "MARKETPLACE",
    },
  },
  [R.LOGISTICS]: {
    [I.FINANCING]: {
      olivObligation: "OPTIONAL",
      advice: "Fuel/route cash-flow support available. Oliv working-capital for fleet operations.",
      olivAction: "Oliv working-capital facility (CHV000) for fleet fuel/ops.",
      alternative: "Shared-route fulfillment, GPS dispatch, e-PoD across hotel network.",
      requiredFields: ["Company Name", "Fleet size", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Onboarding → route-network onboarding",
      cta: "Continue as Carrier",
      redirectKey: "MARKETPLACE",
    },
    [I.INTEGRATE]: {
      olivObligation: "OPTIONAL",
      advice: "Integrate your dispatch/GPS system with our shipment webhooks.",
      olivAction: "Oliv working-capital optional (CHV000).",
      alternative: "Dock e-PoD, GPS tracking, consolidated route assignment.",
      requiredFields: ["Company Name", "System/API", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Dispatch/GPS integration → live delivery visibility",
      cta: "Continue to Integration",
      redirectKey: "ERP_INTEGRATION",
    },
    [I.ALREADY_ON_OLIV]: {
      olivObligation: "LINK_EXISTING",
      advice: "Link your Oliv account to apply working-capital across dispatch volume.",
      olivAction: "Pair your Oliv account (CHV000 network).",
      alternative: "Route assignment + e-PoD on the shared network.",
      requiredFields: ["Company Name", "Oliv Account / Facility ID", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Link Oliv → route-network onboarding",
      cta: "Link My Oliv Account",
      redirectKey: "LINK_OLIV",
    },
    [I.MARKETPLACE]: {
      olivObligation: "NOT_REQUIRED",
      advice: "Join the shared-route fulfillment network and get dispatch volume.",
      olivAction: "Working-capital optional later (Oliv, CHV000).",
      alternative: "Shared coastal-cluster routes, GPS, e-PoD — lower empty-mileage.",
      requiredFields: ["Company Name", "Fleet size", "Zones", "Contact Person", "Phone", "Email", "Password"],
      nextStep: "Onboarding → accept dispatch trips",
      cta: "Continue as Carrier",
      redirectKey: "MARKETPLACE",
    },
  },
};

const DEFAULT_RESULT: ValidationResult = {
  olivObligation: "NOT_REQUIRED",
  advice: "Contact support for guidance.",
  olivAction: "Contact support.",
  alternative: "Contact support.",
  requiredFields: [],
  nextStep: "Contact support.",
  cta: "Contact support.",
  redirectKey: "MARKETPLACE",
};

export function validateOnboarding(
  role: ValidatorRole,
  intent: FundingIntent
): ValidationResult {
  const row = MATRIX[role]?.[intent];
  if (row) return row;
  return MATRIX[role]?.[I.MARKETPLACE] ?? DEFAULT_RESULT;
}

export const ROLES: ValidatorRole[] = ["HOTEL", "SUPPLIER", "FACTORING", "LOGISTICS"];
export const INTENTS: FundingIntent[] = ["FINANCING", "INTEGRATE", "ALREADY_ON_OLIV", "MARKETPLACE"];
export const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.oliv.fintech";
export const APP_STORE_URL = "https://apps.apple.com/app/oliv";
export const REFERRAL_CODE = "CHV000";
export { APP, OLIV_URL };
