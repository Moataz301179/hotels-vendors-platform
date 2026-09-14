/**
 * Unified Payment Router
 * Hotels Vendors Fintech Layer
 *
 * Exports all payment adapters behind a common interface.
 * Consumers should import from this file rather than individual adapters.
 */

// ─────────────────────────────────────────
// 1. ADAPTER EXPORTS
// ─────────────────────────────────────────

export { fawryAdapter } from "./fawry";
export { instapayAdapter } from "./instapay";

// ─────────────────────────────────────────
// 2. TYPE RE-EXPORTS
// ─────────────────────────────────────────

export type {
  FawryChargeRequest,
  FawryChargeResponse,
  FawryRefundRequest,
  FawryRefundResponse,
  FawryStatusResponse,
  FawryCallbackPayload,
} from "./fawry";

export type {
  InstaPayWallet,
  InstaPayTransferRequest,
  InstaPayTransferResponse,
  InstaPayValidateResponse,
  InstaPayBalanceResponse,
  InstaPayCallbackPayload,
} from "./instapay";

// ─────────────────────────────────────────
// 3. UNIFIED INTERFACE (optional consumer helper)
// ─────────────────────────────────────────

import { fawryAdapter } from "./fawry";
import { instapayAdapter } from "./instapay";

export const paymentAdapters = {
  fawry: fawryAdapter,
  instapay: instapayAdapter,
} as const;

export type PaymentProvider = keyof typeof paymentAdapters;

// ─────────────────────────────────────────
// 4. MOCK STATUS CHECK
// ─────────────────────────────────────────

export function isMockMode(provider: PaymentProvider): boolean {
  switch (provider) {
    case "fawry":
      return !process.env.FAWRY_MERCHANT_CODE || !process.env.FAWRY_SECRET || process.env.FAWRY_MOCK === "true";
    case "instapay":
      return !process.env.INSTAPAY_API_KEY || !process.env.INSTAPAY_SECRET || process.env.INSTAPAY_MOCK === "true";
    default:
      return true;
  }
}
