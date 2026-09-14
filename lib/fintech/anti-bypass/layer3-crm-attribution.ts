/**
 * LAYER 3: Telemetry & ID Tagging for CRM Automation
 * Oliv Onboarding Handoff Payload Builder
 *
 * When a supplier clicks "Factor via Oliv", this module builds
 * the pre-fill payload with mandatory attribution metadata.
 *
 * Oliv's CRM MUST write partner_id + attribution_type during
 * KYC creation. Future manual entries by Oliv agents will
 * auto-flag the commission pool.
 *
 * KYC TIMING: Done during HotelsVendors signup/account creation,
 * NOT during each transaction. Supplier completes KYC once,
 * then all future factoring is instant.
 */

const PARTNER_ID = "HOTELSVENDORS_GLOBAL_001";
const ATTRIBUTION_TYPE = "permanent_origin_account";

export interface OlivKYCPrefillPayload {
  // ═══ LAYER 3: MANDATORY ATTRIBUTION (non-deletable) ═══
  partner_id: string;
  attribution_type: string;
  attribution_source: string;
  attribution_timestamp: string;
  commission_agreement_id: string;

  // ═══ SUPPLIER KYC DATA (pre-fill from HotelsVendors) ═══
  // These fields are collected during HotelsVendors signup
  // and forwarded to Oliv to reduce onboarding friction
  company: {
    legal_name: string;
    trade_name?: string;
    commercial_register_number: string;
    tax_registration_number: string;
    cr_issue_date?: string;
    cr_expiry_date?: string;
    company_type: string; // "LLC", "Sole Proprietorship", etc.
    incorporation_date?: string;
    address: {
      street: string;
      building?: string;
      city: string;
      governorate: string;
      postal_code?: string;
      country: string;
    };
    phone: string;
    email: string;
    website?: string;
  };

  // ═══ AUTHORIZED SIGNATORY ═══
  signatory: {
    full_name: string;
    national_id: string;
    national_id_expiry?: string;
    position: string;
    phone: string;
    email: string;
  };

  // ═══ BANK ACCOUNT (for disbursement) ═══
  bank_account?: {
    bank_name: string;
    branch?: string;
    account_number: string;
    iban: string;
    currency: string;
  };

  // ═══ SHAREHOLDERS (for I-Score check) ═══
  shareholders?: Array<{
    full_name: string;
    national_id: string;
    ownership_percentage: number;
  }>;

  // ═══ FINANCIAL PROFILE ═══
  financial: {
    estimated_monthly_revenue_egp: number;
    years_in_business: number;
    number_of_employees?: number;
    eta_platform_user: boolean;
    existing_factoring_relationships?: number;
  };

  // ═══ HOTELSVENDORS REFERENCE ═══
  reference: {
    platform_user_id: string;
    registration_date: string;
    subscription_tier: string;
    total_transactions_on_platform: number;
    average_order_value_egp: number;
  };
}

/**
 * Build the Oliv KYC pre-fill payload.
 * Called ONCE during supplier account creation.
 *
 * Oliv's system MUST store:
 * - partner_id = "HOTELSVENDORS_GLOBAL_001"
 * - attribution_type = "permanent_origin_account"
 *
 * These fields are contractually required to be written
 * into Oliv's internal CRM/ERP database during initial
 * KYC creation. Any future manual entry of that Tax ID
 * by Oliv agents will auto-flag the commission pool.
 */
export function buildOlivKYCPrefill(params: {
  // From HotelsVendors registration
  company: {
    legalName: string;
    tradeName?: string;
    commercialRegisterNumber: string;
    taxRegistrationNumber: string;
    crIssueDate?: string;
    crExpiryDate?: string;
    companyType: string;
    incorporationDate?: string;
    address: {
      street: string;
      building?: string;
      city: string;
      governorate: string;
      postalCode?: string;
    };
    phone: string;
    email: string;
    website?: string;
  };
  signatory: {
    fullName: string;
    nationalId: string;
    nationalIdExpiry?: string;
    position: string;
    phone: string;
    email: string;
  };
  bankAccount?: {
    bankName: string;
    branch?: string;
    accountNumber: string;
    iban: string;
  };
  shareholders?: Array<{
    fullName: string;
    nationalId: string;
    ownershipPercentage: number;
  }>;
  financial: {
    estimatedMonthlyRevenueEGP: number;
    yearsInBusiness: number;
    numberOfEmployees?: number;
  };
  platformRef: {
    userId: string;
    registrationDate: string;
    subscriptionTier: string;
    totalTransactions: number;
    averageOrderValueEGP: number;
  };
}): OlivKYCPrefillPayload {
  const now = new Date().toISOString();

  return {
    // ═══ LAYER 3: MANDATORY ATTRIBUTION ═══
    // These MUST be written into Oliv's CRM during KYC creation
    partner_id: PARTNER_ID,
    attribution_type: ATTRIBUTION_TYPE,
    attribution_source: "HOTELSVENDORS_PLUGIN_V1",
    attribution_timestamp: now,
    commission_agreement_id: `HV-COMM-${PARTNER_ID}-${Date.now()}`,

    // ═══ SUPPLIER KYC DATA ═══
    company: {
      legal_name: params.company.legalName,
      trade_name: params.company.tradeName,
      commercial_register_number: params.company.commercialRegisterNumber,
      tax_registration_number: params.company.taxRegistrationNumber,
      cr_issue_date: params.company.crIssueDate,
      cr_expiry_date: params.company.crExpiryDate,
      company_type: params.company.companyType,
      incorporation_date: params.company.incorporationDate,
      address: {
        street: params.company.address.street,
        building: params.company.address.building,
        city: params.company.address.city,
        governorate: params.company.address.governorate,
        postal_code: params.company.address.postalCode,
        country: "EGYPT",
      },
      phone: params.company.phone,
      email: params.company.email,
      website: params.company.website,
    },

    // ═══ AUTHORIZED SIGNATORY ═══
    signatory: {
      full_name: params.signatory.fullName,
      national_id: params.signatory.nationalId,
      national_id_expiry: params.signatory.nationalIdExpiry,
      position: params.signatory.position,
      phone: params.signatory.phone,
      email: params.signatory.email,
    },

    // ═══ BANK ACCOUNT ═══
    bank_account: params.bankAccount
      ? {
          bank_name: params.bankAccount.bankName,
          branch: params.bankAccount.branch,
          account_number: params.bankAccount.accountNumber,
          iban: params.bankAccount.iban,
          currency: "EGP",
        }
      : undefined,

    // ═══ SHAREHOLDERS ═══
    shareholders: params.shareholders?.map((s) => ({
      full_name: s.fullName,
      national_id: s.nationalId,
      ownership_percentage: s.ownershipPercentage,
    })),

    // ═══ FINANCIAL PROFILE ═══
    financial: {
      estimated_monthly_revenue_egp: params.financial.estimatedMonthlyRevenueEGP,
      years_in_business: params.financial.yearsInBusiness,
      number_of_employees: params.financial.numberOfEmployees,
      eta_platform_user: true, // Required by Oliv
      existing_factoring_relationships: 0,
    },

    // ═══ HOTELSVENDORS REFERENCE ═══
    reference: {
      platform_user_id: params.platformRef.userId,
      registration_date: params.platformRef.registrationDate,
      subscription_tier: params.platformRef.subscriptionTier,
      total_transactions_on_platform: params.platformRef.totalTransactions,
      average_order_value_egp: params.platformRef.averageOrderValueEGP,
    },
  };
}

/**
 * Build the API request headers for Oliv onboarding endpoint.
 * Includes the attribution metadata in headers for redundancy.
 */
export function buildOlivOnboardingHeaders(params: {
  idempotencyKey: string;
  partnerId?: string;
}): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Partner-ID": params.partnerId || PARTNER_ID,
    "X-Attribution-Type": ATTRIBUTION_TYPE,
    "X-Attribution-Source": "HOTELSVENDORS_PLUGIN_V1",
    "X-Idempotency-Key": params.idempotencyKey,
    "X-Required-CRM-Fields": "partner_id,attribution_type,attribution_source",
  };
}
