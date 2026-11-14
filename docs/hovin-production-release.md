# HOVIN production release runbook

Owner-authorized path to ship HOVIN to TestFlight / Play and enable store links on `https://www.hotelsvendors.com/hovin`.

## Verified facts (repo)

- Bundle / package: `com.hotelsvendors.hovin`
- Native projects exist under `mobile/ios` and `mobile/android`
- EAS profiles live in `mobile/eas.json` (development / preview / production)
- Reanimated is a dependency; Babel plugin only — **not** an Expo config plugin
- HOVIN Prisma migration on branch: `prisma/migrations/20261112210000_hovin_phone_evidence_and_delivery_code`
- Store badges on `/hovin` activate only when `NEXT_PUBLIC_IOS_DOWNLOAD_URL` / `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` are set

## Blockers this agent cannot finish alone

1. Expo account + `EXPO_TOKEN` (or interactive `eas login`)
2. Apple Developer team + App Store Connect app + signing
3. Google Play Console app + Play upload key
4. Explicit `APPLY_AFTER_NEON_BACKUP` after a restorable Neon production branch exists
5. Merge of PR stack to `main` and production web deploy (GitHub write merge / deploy dispatch)

## Execute — Mac simulator (owner machine)

Full troubleshooting for “Building • 451/455”, yellow RN warnings, “No script URL”, and Apple Account simulator sheets: **`docs/hovin-simulator-runbook.md`**.

```bash
cd mobile
git checkout cursor/hovin-simulator-fix-168e   # or cursor/hovin-intelligence-168e once merged
npm ci
# Pin Node for Xcode GUI (required — empty NODE_BINARY hangs late script phases):
node -e "console.log(process.execPath)"   # paste into ios/.xcode.env.local as NODE_BINARY
npx pod-install
npm run doctor:ios
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…
export EXPO_PUBLIC_HOVIN_API_ORIGIN=https://www.hotelsvendors.com
npm start          # Terminal A — required for Debug
npm run ios        # Terminal B
npx expo run:android
```

Fresh native rebuild is required after Reanimated was added. Prefer `npm run ios` over bare Xcode Run; if using Xcode, open `ios/HOVIN.xcworkspace` and keep Metro up for Debug.

## Execute — EAS signed builds

```bash
cd mobile
npm ci
npx eas-cli login          # or EXPO_TOKEN
npx eas-cli init           # writes real expo.extra.eas.projectId
node scripts/release-readiness.mjs
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
npx eas-cli submit --platform ios --profile production
npx eas-cli submit --platform android --profile production
```

After TestFlight / Play internal URLs exist, set on the web deploy:

```bash
NEXT_PUBLIC_IOS_DOWNLOAD_URL=https://apps.apple.com/...
NEXT_PUBLIC_ANDROID_DOWNLOAD_URL=https://play.google.com/store/apps/details?id=com.hotelsvendors.hovin
```

## Execute — production database + web

1. Merge motion PR into intelligence, then intelligence into `main` (owner merge).
2. Create/validate Neon production backup branch.
3. Reply `APPLY_AFTER_NEON_BACKUP` and run `HotelsVendors Production Deploy` from `main`.
4. Confirm `/hovin` serves brand section + live store links; health releaseId matches SHA.

## Honesty rule

Passing `release-readiness.mjs` means the **repository** is ready for EAS. It does **not** mean the app is live on the App Store or Google Play.
