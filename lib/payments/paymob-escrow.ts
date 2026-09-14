/**
 * Paymob Marketplace Escrow — Re-export from canonical adapter
 *
 * The canonical Paymob adapter lives at lib/payments/paymob/index.ts.
 * This file re-exports for backward compatibility with escrow route.
 */

export {
  createEscrowDeposit,
  releaseEscrowToken,
  getEscrowStatus,
} from "./paymob/index";

export type {
  EscrowInvoice,
  EscrowCreateResult,
  TokenReleaseInput,
} from "./paymob/index";
