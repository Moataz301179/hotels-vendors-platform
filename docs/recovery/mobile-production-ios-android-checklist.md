# HOVIN Mobile Production Checklist — iOS and Android

Status updated 2026-11-05. This is a separate mobile release track from HotelsVendors web production. No store build, submission, or release is verified.

## Shared blockers

| ID | Blocker | Status | Closure evidence |
|---|---|---|---|
| MOB-01 | One canonical mobile source is recorded at `mobile/` in `Moataz301179/hotels-vendors-platform` on `main`. It owns HOVIN and `com.hotelsvendors.hovin`. The standalone `Moataz301179/hotels-vendors-mobile` repository is quarantined as legacy reference: it is a dirty Expo 57/React Navigation client using obsolete `/api/v1` and `com.hotelsvendors.app`. | VERIFIED | `docs/recovery/mobile-source-of-truth.json` plus `npm run test:mobile-source` pass. Only the canonical path may produce artifacts. |
| MOB-02 | Build the controlled receiving flow: authorized PO only; item-level received, missing, and damaged quantities; photo evidence; receipt confirmation; employee/hotel/time audit. Hide prices and financing from receiving users. | PENDING | Device flow works end-to-end against a test backend and role/tenant access checks pass. |
| MOB-03 | Complete offline draft and synchronization with stable receipt identity, safe retry, and server-side idempotency. The candidate offline queue tests use a fake in-memory DB; the GRN POST currently does not persist/use an idempotency key, so a retry after server commit can create a duplicate GRN. | BLOCKED | SQLite/device persistence and restart/reconnect tests pass; server deduplicates retries after a committed response is lost; cross-tenant access is denied. |
| MOB-04 | Implement durable photo/evidence upload and match its URL contract to the GRN API. Current POST accepts existing HTTPS evidence URLs; no mobile upload flow or upload endpoint was verified. | BLOCKED | Upload contract exists, files persist securely, and proof is attached to the correct receipt line/GRN. |
| MOB-05 | Verify exception and funding controls. Discrepancies must not auto-release funding; receipt evidence and audit identity must survive sync. | PENDING | Automated API and workflow tests prove variance blocks finance/release and audit trail records employee, tenant, timestamp, and action. |
| MOB-06 | Reconcile latest Grok requirements. The retrieved context contains HOVIN receiving requirements but not the actual Grok transcript, exact app architecture, or detailed store requirements. | BLOCKED | Source transcript/backlog recovered and decisions mapped to implemented screens, APIs, and acceptance tests; unavailable items remain explicit open decisions. |
| MOB-07 | Remove/rotate exposed signing material found in a tracked QA document without breaking existing Android update signing continuity. Secret value is intentionally omitted from this checklist. | SECURITY ACTION REQUIRED | Tracked exposure removed where possible; current validity assessed; upload signing credentials rotated/reset with Play App Signing continuity protected; repository history and build configuration checked for remaining copies. |

## Android release gates

- Build signed production AAB and internal APK from the canonical source and release commit; install and smoke-test both.
- Verify Android package identity `com.hotelsvendors.hovin`, signing continuity, incremented version code, and EAS remote versioning behavior.
- Test Clerk authentication/OTP, camera and media permissions, barcode/QR scan, controlled receipt, offline restart/retry, evidence upload, and tenant isolation on emulator and physical Android device.
- Confirm Play Console upload track and publication state. A past QA report or local AAB/APK is not evidence of a current Play release.

## iOS release gates

- Build and sign an iOS archive from the canonical source and release commit; verify bundle ID `com.hotelsvendors.hovin`, provisioning, signing, and incremented build/version.
- Test authentication/OTP, camera/photo permission prompts, barcode/QR scan, controlled receipt, offline restart/retry, evidence upload, and tenant isolation on a physical iPhone.
- Upload/install the build through TestFlight and record App Store submission/review/publication status. A JavaScript bundle export is not evidence of a signed iOS release.

## Evidence already found

- Standalone HOVIN main commit `e7345f8f928f749301a0d4be455b6a9b62dbcbb0` (2026-10-24) has a passing “Mobile Quality” workflow for TypeScript and Expo JS bundle exports. It does not establish signed binaries, device acceptance, or store publication.
- Its `DockScannerScreen.tsx` says scan capture alone does not accept goods, create a GRN, or record offline success.
- Platform PR #46 has an offline outbox and unit tests, but the app UI is a placeholder and tests do not prove real SQLite/device/network behavior.
- The standalone QA report is dated 2026-08-13 and documents Android emulator testing only; it is not current iOS or store-release evidence.
- No current EAS signed build, TestFlight upload, Play Console release, or store publication was verified.

## Release decision

**Mobile is not production-ready for either store.** Keep this track separate from web acceptance. Do not claim iOS or Android production release until the canonical source, receiving flow, durable evidence, idempotent backend sync, real device checks, signing continuity, and store evidence all pass.
