# Admin module completion contract

Scope authorized by the user's request to complete the admin pack, 7 October 2026. Builds on the approved architecture baseline and toolkit report; does not authorize deployment, fake partner connections or unilateral credit approval.

Implement database-backed procurement, supplier verification, catalog, shipments, returns/disputes, invoice/fee oversight, automation history and reports with bounded filtering, redacted DTOs, explicit cross-tenant permissions and read-access audit. Compliance views show status metadata only, never ETA payloads or keys. Job history does not imply a connected worker.

Routine changes use a persisted request/confirmation lifecycle: the active PLATFORM OWNER may confirm their own allowlisted nonfinancial request after recent second-factor verification; other administrators retain independent approval. This sole-owner routine policy was authorized by the user on 7 October 2026. Both permissions are revalidated, requests expire, target snapshots reject stale execution, execution is serialized and audit-logged in the same transaction. No client-supplied co-authorizer ID is a signature. Authority Matrix overrides retain dual authorization. No direct grant of financing or fabricated payment guarantees. No new funder API integration without its contract.

Financial operations remain oversight only until the required fintech specifications and partner contracts are approved. Credit freeze/unfreeze must not reinterpret a pending application as an approved facility. Availability of an operational table does not imply unrestricted mutation rights.

Success requires negative permission tests, approval self-sign/replay/expiry/stale checks, validated pagination, report-export sanitization, full TypeScript/build, route checks and an explicit record of any production-dependent checks still blocked.

## Marketplace population policy

Public-source discovery may create internal leads or inactive staged records, with source URL, retrieval time and provenance retained. It must not copy a protected catalog, use credentials without supplier authorization, claim stock or price freshness, or publish a listing. Publication requires a real supplier tenant, supplier-owned confirmation of identity, price and availability, and the controlled verification workflow. If no verified supplier records exist, the marketplace shows a truthful empty state and a supplier onboarding path.
