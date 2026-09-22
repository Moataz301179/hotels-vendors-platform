# ETA Integration — Quick Reference

Official spec: https://sdk.invoicing.eta.gov.eg/api/

Key endpoints for HotelsVendors:
- `/api/01-login-as-taxpayer-system` (token)
- `/api/08-erp-ping` (verification)
- Document submission APIs (invoice lifecycle → `PENDING` → `SUBMITTED` → `ACCEPTED`/`VALIDATED`)

Integration rules (from docs/eta-integration.md):
- Invisible engine: no UI routes, no client references to `lib/eta/`.
- Trigger: `invoice.status = ISSUED` → background submission.
- Idempotency: `invoice_eta:{invoiceId}`.
- Dead-letter: 3 retries → manual resolution (`lib/eta/queue.ts`).
- Audit: `audit_entries.entity = "invoice_eta"` for every submission/rejection.
