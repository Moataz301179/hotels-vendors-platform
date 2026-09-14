/**
 * Paymob Payment Integration — Re-export from canonical adapter
 *
 * The canonical Paymob adapter lives at lib/payments/paymob/index.ts.
 * This file re-exports for backward compatibility with deposit, create-intent,
 * and paymob-callback routes importing from this path.
 */

export {
  getAuthToken,
  createPaymobOrder,
  generatePaymentKey,
  createDepositPayment,
  verifyPaymobCallback,
  paymobAdapter,
  initializePaymobPayment,
  getPaymobIframeUrl,
  verifyPaymobWebhook,
} from "./paymob/index";

export type {
  DepositRequest,
  PaymobWebhookPayload,
} from "./paymob/index";
