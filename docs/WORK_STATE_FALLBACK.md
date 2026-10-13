# Work-state fallback

The Claude-mem work-state service is unavailable in this environment (`claude auth status` reports `loggedIn: false`). Until its credentials are restored, this append-only register is the local recovery ledger. It is not a production-readiness claim.

## Current open gates

- [done] Web shell candidate built and promoted; live health transport verified.
- [done] Mobile light-theme/auth-session code and Expo exports verified locally.
- [done] Read-only catalog readiness validator added; it correctly blocks unverified materialization.
- [todo] Expand catalog to 5,000 unique records with provenance and validation evidence.
- [todo] Verify operational supplier register and supplier-private data boundaries.
- [todo] Prove authenticated RFQ-to-invoice procurement flow in staging.
- [todo] Complete real-device iOS/Android Clerk session acceptance.
- [todo] Independently verify staging/production migration parity and backup restore rehearsal.
- [todo] Reconcile one immutable release SHA across source, PM2, Nginx, and live health.

## Latest direct evidence (2026-10-13)

- Neon console is authenticated to project `HotelsVendors`, branch `staging-pre-spend-sourcing-20261010`, ID `br-cool-recipe-b5sck7k5`, database `neondb`.
- Read-only SQL found 36 migration ledger rows, 32 unique names, and zero unresolved failed rows (`finished_at IS NULL AND rolled_back_at IS NULL`). Four historical rows are explicitly rolled back duplicates.
- Staging counts: 77 products, 9 suppliers, 3 hotels, 0 RFQs, 0 quotes, 0 orders, 0 GRNs, 0 invoices.
- Production Neon counts: 0 products, 0 suppliers, 2 hotels, 0 RFQs, 0 quotes, 0 orders, 0 GRNs, 0 invoices.
- Live health reports release `frontend-6ebb449-20261013`, source `6ebb449`; live marketplace still reports 0 listings.

## Rule

Every item moves to `done` only with an environment, immutable identity, command/test evidence, and artifact path. No item is marked complete from chat summaries alone.
