# HOVIN mobile

**HOVIN** — Expo SDK 58 / React Native 0.88, bundle `com.hotelsvendors.hovin`.

Primary launch path is **Expo Go 58.x**. Custom native (`npm run ios` / Xcode) is optional and currently blocked until a separate native regen — do not use Xcode to “fix” day-to-day launch.

## Quick start (Expo Go)

1. Use a checkout that includes the Expo 58 **lockfile fix** (PR #83 / `cursor/hovin-expo-lockfile-168e`, or intelligence after that merges). Plain #82 intelligence breaks `npm ci`.
2. Node **22.13+** (`node -v`).
3. Update **Expo Go** on the phone to **58.x**.
4. From `mobile/`:

```bash
npm ci
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_…   # or repo-root .env.local NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
export EXPO_PUBLIC_HOVIN_API_ORIGIN=https://www.hotelsvendors.com
npm run doctor:go
npx expo login   # same Expo account as Expo Go
npm start -- --tunnel
```

5. Scan the Metro QR with Expo Go.
6. Clerk auth may need an `exp://` redirect URI allowed.

Watermarked UI-only gallery (no Clerk): `EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1`.

Full symptom table: **`../docs/hovin-simulator-runbook.md`**.

## Optional: custom native client (Mac / Xcode)

Only after SDK 58 native projects are regenerated:

```bash
npm run doctor:ios
npm start    # Terminal A
npm run ios  # Terminal B
```
