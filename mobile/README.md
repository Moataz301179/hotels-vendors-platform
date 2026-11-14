# HOVIN mobile

**HOVIN** — Expo SDK 58 / React Native 0.88, bundle `com.hotelsvendors.hovin`.

Primary launch path is **Expo Go 58.x** from the App / Play Store. Custom native (`npm run ios` / Xcode) remains an optional advanced path.

## Quick start (Expo Go)

1. Update **Expo Go** on your phone to **58.x** (store build). Older Expo Go cannot open this project.
2. From `mobile/`:

```bash
npm ci
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_…   # or rely on repo-root .env.local NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
export EXPO_PUBLIC_HOVIN_API_ORIGIN=https://www.hotelsvendors.com
npx expo login   # same Expo account signed into Expo Go
npm start -- --tunnel
```

3. Scan the Metro QR with Expo Go.
4. Clerk auth may need an `exp://` redirect URI allowed in the Clerk dashboard.

Watermarked UI-only gallery (no Clerk): `EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1`.

Full steps: **`../docs/hovin-simulator-runbook.md`**.

## Optional: custom native client (Mac / Xcode)

For a local `HOVIN.app` (not Expo Go) when you need a custom native binary:

```bash
npm run doctor:ios
npm start    # Terminal A — Metro for Debug
npm run ios  # Terminal B — installs/launches HOVIN.app
```

- Pin `NODE_BINARY` in `ios/.xcode.env.local` before Xcode GUI builds.
- Debug builds need Metro. Release embeds the JS bundle.
- See the runbook for simulator troubleshooting (`451/455`, Apple Account sheets, etc.).
