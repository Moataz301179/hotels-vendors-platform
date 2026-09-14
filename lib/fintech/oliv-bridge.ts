/**
 * Oliv Finance Bridge — Re-export from canonical adapter
 * Hotels Vendors
 *
 * The canonical Oliv adapter lives at lib/payments/oliv/index.ts.
 * This file re-exports for backward compatibility with factoring-bridge.ts
 * and any other consumers importing from this path.
 */

export { olivFinanceAdapter, OlivFinanceAdapter } from "@/lib/payments/oliv/index";
export type { OlivFactoringStatus } from "@/lib/payments/oliv/index";
