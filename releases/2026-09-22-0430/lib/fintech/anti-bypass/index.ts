/**
 * Oliv Integration Orchestrator
 * Ties all 3 layers together for the factoring flow
 *
 * Flow:
 * 1. Supplier completes KYC during HotelsVendors signup (Layer 3)
 * 2. Supplier imports ETA invoice
 * 3. Supplier clicks "Factor via Oliv"
 * 4. System generates referral token (Layer 1)
 * 5. System sends invoice + token to Oliv
 * 6. Oliv pings callback with token (Layer 2)
 * 7. HotelsVendors verifies token + blocks unauthorized reconciliation
 */

import { generateReferralToken } from "./layer1-referral-token";
import { buildOlivKYCPrefill } from "./layer3-crm-attribution";

export interface FactoringRequest {
  etaUuid: string;
  supplierTaxId: string;
  supplierName: string;
  hotelTaxId: string;
  hotelName: string;
  invoiceTotal: number;
  vatAmount: number;
  invoiceIssueDate: string;
  invoiceDueDate: string;
  financingDays: number;
}

/**
 * Initiate factoring request.
 * Called when supplier clicks "Factor via Oliv" on the dashboard.
 */
export function initiateFactoring(request: FactoringRequest) {
  // 1. Generate referral token (Layer 1)
  const referralToken = generateReferralToken({
    etaUuid: request.etaUuid,
    supplierTaxId: request.supplierTaxId,
    hotelTaxId: request.hotelTaxId,
    invoiceTotal: request.invoiceTotal,
  });

  // 2. Build Oliv API payload
  const payload = {
    // Layer 1: Referral token in header
    _hotelsvendors_referral_token: {
      signature: referralToken.signature,
      payload: referralToken.payload,
      partner_id: referralToken.partnerId,
      token_version: referralToken.tokenVersion,
      generated_at: referralToken.generatedAt,
      expires_at: referralToken.expiresAt,
    },

    // Layer 3: Attribution metadata
    partner_id: "HOTELSVENDORS_GLOBAL_001",
    attribution_type: "permanent_origin_account",
    attribution_source: "HOTELSVENDORS_PLUGIN_V1",

    // Invoice data
    invoice: {
      eta_uuid: request.etaUuid,
      supplier_tax_id: request.supplierTaxId,
      supplier_name: request.supplierName,
      hotel_tax_id: request.hotelTaxId,
      hotel_name: request.hotelName,
      total: request.invoiceTotal,
      vat: request.vatAmount,
      currency: "EGP",
      issue_date: request.invoiceIssueDate,
      due_date: request.invoiceDueDate,
    },

    // Financing parameters
    financing: {
      requested_days: request.financingDays,
      advance_rate: 0.85, // 85% advance
      factoring_type: "non_recourse",
    },

    // Callback endpoint (Oliv must ping this)
    callback_url: "https://www.hotelsvendors.com/api/v1/oliv/payout-callback",
  };

  return {
    referralToken,
    payload,
    headers: {
      "Content-Type": "application/json",
      "X-HotelsVendors-Referral-Token": referralToken.signature,
      "X-Partner-ID": "HOTELSVENDORS_GLOBAL_001",
      "X-Attribution-Type": "permanent_origin_account",
      "X-Callback-URL": "https://www.hotelsvendors.com/api/v1/oliv/payout-callback",
    },
  };
}

export { buildOlivKYCPrefill };
