# HOVIN phone / simulator runbook

## Owner: if “HOVIN still doesn’t work” after SDK 58

**Use Expo Go 58.x.** Do **not** open Xcode → `HOVIN.xcworkspace` for this symptom. Committed `mobile/ios` was not regenerated for SDK 58; the custom native binary is a separate follow-up.

| What you see | Likely cause | Fix |
| --- | --- | --- |
| `npm ci` errors about Missing `@react-native/metro-config@0.88.1` | Intelligence still has the broken #82 lockfile | Merge / checkout **PR #83** (`cursor/hovin-expo-lockfile-168e`) then `npm ci` |
| “Project is incompatible with this version of Expo Go” | Phone Expo Go is not 58.x | Update Expo Go from the App Store / Play Store |
| Charcoal screen “HOVIN is not configured” | Metro started without Clerk key | `export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_…` (or root `.env.local`), restart Metro |
| Blank charcoal / stuck splash | Fonts stalled or Metro never connected | Wait 8s; confirm Metro is up; rescan QR; try `EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1` |
| Metro won’t start / engine errors | Node < 22.13 | `node -v` → install Node 22.13+ |
| Sign-in opens then fails redirect | Clerk missing `exp://` allowlist | Add Expo Go redirect in Clerk dashboard |
| Xcode Building • 451/455 / HOVIN.app | Wrong path for day-to-day | Quit Xcode; use Expo Go checklist below |

## Primary path: Expo Go (SDK 58)

```bash
cd /Users/Moatazi/hotels-vendors-new   # official workspace
git fetch origin
# Prefer intelligence once #83 is merged; until then:
git checkout cursor/hovin-expo-lockfile-168e   # or cursor/hovin-expo-go-launch-168e
# After merge: git checkout cursor/hovin-intelligence-168e && git pull

cd mobile
node -v    # must be ^22.13 (or ^24.3)
npm ci
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…   # or rely on ../.env.local NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
export EXPO_PUBLIC_HOVIN_API_ORIGIN=https://www.hotelsvendors.com
npm run doctor:go
npx expo login   # same Expo account signed into Expo Go on the phone
npm start -- --tunnel
```

On the phone: open **Expo Go 58.x** → scan the Metro QR.

UI-only smoke (no Clerk):

```bash
export EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1
npm run doctor:go
npm start -- --tunnel
```

Clerk may require an `exp://` redirect URI for the Expo Go session.

This Linux Cloud Agent can typecheck / export JS but cannot hold a phone session — the owner verifies the QR path on device.

## Optional advanced path: custom native client (Mac / Xcode)

Use only when you need a local **`HOVIN.app`** after a **separate** SDK 58 native regen / EAS prebuild. Open **`mobile/ios/HOVIN.xcworkspace`**, never the bare `.xcodeproj`. Until that regen lands, prefer Expo Go.

### What the Xcode screenshot usually means

| Symptom | Likely meaning |
| --- | --- |
| Status **Building • 451/455** with only yellow warnings | Often still linking. `ios.buildReactNativeFromSource=true` makes late steps slow (minutes), not dead. |
| Issue navigator: React-cxxreact “no symbols”, Hermes CDPHandler / integer precision | Inherited React Native / CocoaPods noise. **Non-fatal** unless the build ends with a red error. |
| App opens to **No script URL provided** or a blank charcoal screen | Debug scheme skips embedding JS. Metro is not running — start `npm start`, then relaunch **HOVIN**. |
| Config / setup copy instead of phone home | Missing `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (or set `EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1`). |
| Simulator stuck with an Apple Account sheet | Host simulator state — dismiss, then relaunch. |

### One-time Mac pins

```bash
cd mobile
node -e "console.log(process.execPath)"
# write absolute Node path into ios/.xcode.env.local as NODE_BINARY
npm ci
npx pod-install
node scripts/ios-sim-doctor.mjs
```

### Do not change for Xcode hang symptoms

- Do not remove `with-xcode27-fmt-fix` or `with-ios-script-sandboxing`.
- Regenerating committed `ios/` / `android/` / EAS for SDK 58 is a **separate** change from the Expo Go JS upgrade.

## Related docs

- `docs/hovin-production-release.md` — EAS / store path
- `docs/hovin-motion-system.md` — Reanimated rebuild note
- `HANDOVER.md` — last verified evidence
