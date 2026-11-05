# Mobile source-integrity status — 2026-11-05

## Verified facts

- The canonical HOVIN source is `mobile/` in this platform repository on `main`, with bundle/package identity `com.hotelsvendors.hovin`.
- The standalone `Moataz301179/hotels-vendors-mobile` checkout is a separate dirty legacy reference. It has a different package identity (`com.hotelsvendors.app`) and an obsolete `/api/v1` client contract; it is not a release source.
- `docs/recovery/mobile-source-of-truth.json` records the boundary and `npm run test:mobile-source` detects identity drift in the canonical app.

## Consequence

Simulator output is not mobile production acceptance. The canonical app still requires the controlled-receiving, offline, evidence-upload, security, device, signing, and store gates in the production checklist.

## Required corrective sequence

1. Build the controlled receiving vertical slice in canonical `mobile/` against `/api/v2`.
2. Define the mobile roles: authorized hotel receiver and assigned delivery/GRN operator; do not expose price, finance, or unrelated workspace controls.
3. Add durable sync, secure evidence upload, and server idempotency proof before device testing.
4. Build from a clean canonical commit, record the Git SHA and EAS project identity, then capture actual login/onboarding/receiving results.
5. Complete real-device authentication, signing, and store distribution acceptance separately.

## Current blockers

- EAS project association, signing continuity, and real-device authentication evidence remain unverified.
- Controlled receiving, durable offline sync, secure evidence upload, and exception/funding blocking are not yet implemented or accepted.
