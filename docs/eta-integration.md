# ETA E-Invoicing Integration Specification

> Source: Official Egyptian Tax Authority (ETA) — https://sdk.invoicing.eta.gov.eg/api/
> Scope: Background compliance engine (G4 — invisible to UI). No client references to ETA endpoints, keys, or payloads.
>
> Integration Lead owner. Updated when official docs change.

## Official API Endpoints (from https://sdk.invoicing.eta.gov.eg/api/)

| Endpoint | Purpose | HotelsVendors Usage |
|---|---|---|
| `/api/01-login-as-taxpayer-system` | Token access | Get JWT before submission |
| `/api/02-get-document-types` | Document types | Retrieve invoice type definitions |
| `/api/03-get-document-type` | Single type details | Validate invoice payload |
| `/api/04-get-document-type-version` | Schema versions | Check structure definitions |
| `/api/07-get-notifications` | Query notifications | Poll for submission confirmations |
| `/api/08-erp-ping` | System verification | Verify endpoint accessible |
| `/api/09-create-egs-code-usage` | Create EGS codes | Map supplier/item codes |
| `/api/12-search-published-codes` | Search codes | Find published EGS/GS1 codes |

## Integration Rules (Per System Guardrail G4)

- **Invisible engine:** Zero pages/components reference `lib/eta/` endpoints, payloads, or API keys.
- **Trigger:** Invoice lifecycle event — `invoice.status = ISSUED` → background queue submits.
- **UUID + Serial:** Every submitted invoice must include ETA-required UUID (`invoice.uuid`) and serial number (`invoice.number`).
- **Dead-letter queue:** Failed submissions land in `lib/eta/queue.ts` with automatic retry and manual resolution path.
- **Digital signing:** Invoice payload must include digital signature (`invoice.signed_at`, `invoice.signature_uuid`) before submission.
- **Audit log:** Every submission/rejection writes to `audit_entries` (`entity = "invoice_eta"`).
- **Idempotency:** `lib/fintech/idempotency.ts` key (`invoice_eta:{invoiceId}`) prevents duplicate submissions.
- **No client-side role switching:** Server-side only (`middleware.ts` + `requirePermission`).

## Adapter Pattern

- `adapter.ts`: Maps internal `Invoice` model → ETA JSON payload. Handles JWT token refresh.
- `validator.ts`: Pre-submission validation (required fields, UUID presence, serial format, digital signature presence).
- `queue.ts`: BullMQ queue (`factoring` or `operations` squad queue) for retries. Dead-letter after 3 retries.

## Database Schema Updates Required

`db/schema.ts` table `invoices` must include:

- `uuid: text` (ETA-required UUID, unique)
- `serialNumber: text` (ETA serial number, derived from invoice number format)
- `etaStatus: text` (`PENDING`, `SUBMITTED`, `ACCEPTED`, `REJECTED`, `VALIDATED`, `FAILED`)
- `submittedAt: timestamp`
- `signedAt: timestamp`
- `signatureUuid: text`
- `deadLetterReason: text`

These fields must NOT appear in any public page/component props (G4 compliance).
