# Funder gateway implementation boundary

The public portals and server-side actor boundaries are implemented. Legacy credit scoring, limit-extension and native payout entry points now fail closed. Legacy tables remain historical records; this change does not erase historical decisions or balances.

`lib/funders/gateway.ts` provides the live-only adapter registry, separate UUID grant reference and 256-bit credential, hashed credential comparison, resource/tenant/client/connection/scope/expiry/revocation checks and canonical tenant-bound snapshot hashing. These are library primitives, not an enabled institutional endpoint. No adapters are registered without an institution's verified integration configuration.

## Persistence and activation requirements

Before exposing a data feed, add FunderConnection, FinancingSignal, DataSharingGrant, FunderAccessToken, OperationalEvidenceEvent, FunderDataSnapshot, FunderSubmission, FunderResponseEvent, IntegrationOutbox and FunderAccessLog as outlined in the reviewed architecture. Use additive, reviewed SQL because production has out-of-band migration history; never run reset or db push. Composite subject-tenant foreign keys bind grants, signals and snapshots; funder-tenant identity remains distinct from subject-tenant identity.

Grant approval requires persisted organization sharing authority, exact permitted record/field categories, purpose, expiry and consent version. A supplier cannot grant access to unrelated buyer history. Existing ConsentRecord metadata must not be repurposed as an unvalidated bearer credential store.

Machine authentication is independent of Clerk's human session authentication. Use a verified OAuth issuer/audience with certificate-bound tokens at a trusted gateway; do not trust a public client-supplied certificate header. Every read independently checks the active connection and sharing grant. A UUID is an identifier, never sufficient authorization.

## Endpoint contract

- GET /api/v2/funders: authenticated live connection availability; never credit eligibility.
- POST /api/v2/financing-signals: authorized organization request, sourced operational facts.
- POST /api/v2/financing-signals/:id/grants: authorized exact sharing consent.
- POST /api/v2/data-sharing-grants/:id/revoke: revoke reads and pending delivery.
- Institution OAuth token endpoint: provisioned authorization server, not an improvised HV password flow.
- GET /api/funder/v1/grants/:uuid/{manifest,purchases,fulfillment,invoices,ledger}: consented snapshots only.
- POST /api/funder/v1/submissions/:id/events: verified external decisions/status, idempotent and replay protected.

External feeds and grant-issuance routes must remain unavailable until these persistence and authentication requirements are implemented and tested. Do not expose existing raw evidence/audit APIs to institutions.

## Operational evidence

Purchase and invoice status remain mutable operational projections. Capture finalized immutable events, with source version, occurred/recorded time, tenant, actor, verification method and document content hash. Corrections append superseding events. POD photographs alone are user-provided claims until verified. Historical delivery metrics require verified timestamps and declared missing-data coverage.

Enforce append-only writes with database privileges and triggers; hash chains alone are not immutability. Sign snapshot manifests using provisioned keys and store independent integrity anchors. Transactional outbox entries must be committed with the corresponding business/evidence event. Partners receive field-whitelisted projections, never direct DB access or full raw tenant audit logs.

Revocation stops future sharing; it cannot retract data already delivered to an external institution. Logs retain delivery/access evidence without raw credentials. Retention and recipient obligations must be part of onboarding.

## Release requirements

Test cross-role/tenant/partner/resource reads, expired/revoked credentials, replayed external events, duplicate delivery, unavailable adapters, concurrent corrections and forbidden mutation. Confirm native scoring/payout paths cannot execute. Institutions determine eligibility, rates, limits, approval, disbursement and repayment; HV never sets those outcomes from operational signals.
