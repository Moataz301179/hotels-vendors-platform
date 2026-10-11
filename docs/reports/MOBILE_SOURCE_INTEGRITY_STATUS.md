# Mobile source-integrity status — 2026-10-11

## Verified facts

- The previous iOS Simulator installation identified itself as `com.hotelsvendors.hovin` / `HOVIN`; it was not a release tied to the isolated web procurement branch.
- The installed simulator application was removed before attempting a replacement. A current-source iOS Simulator build is in progress and must finish before an install can be considered valid.
- The mobile checkout is independently dirty and contains an extensive HOVIN field/operations layer: its application entry, navigation, onboarding, authentication copy, and numerous screens retain that identity.
- The current HOVIN source has Clerk Expo provider wiring and the mobile authentication store has been hardened separately, but that does not make the old product layer a HotelsVendors release.

## Consequence

The simulator's prior appearance cannot be used as mobile acceptance evidence. Reinstalling the same source without a deliberate legacy-layer replacement would reproduce mixed product identity and unsupported flows.

## Required corrective sequence

1. Establish a clean mobile release worktree and source commit instead of modifying the dirty mobile checkout in place.
2. Remove or replace the HOVIN field/operations routes from the user-visible navigator; preserve only explicitly approved logistics capability after it is connected to the HotelsVendors procurement API.
3. Define the current HotelsVendors role entry points: hotel buyer, verified supplier, administrator, and approved delivery/GRN operator.
4. Rebuild the simulator bundle from that release commit, record the Git SHA and EAS project identity, then capture the actual login/onboarding/result screens.
5. Only then perform a real-device Clerk authentication test after the physical device is connected and unlocked.

## Current blockers

- EAS project identity conflict: configured project ID resolves to `invo`, while the app slug is `hovin`. It requires an explicit project-association decision; no destructive reassignment has been made.
- Physical iPhone is offline, so no real-device authentication evidence exists.
- No current-source iOS bundle exists until the running Xcode Simulator build completes successfully.
