# HOVIN iOS simulator runbook (Mac only)

This Cloud Agent / Linux VM **cannot** run Xcode or the iPhone simulator. Use this on the Mac that owns the HOVIN checkout.

## HOVIN vs Expo Go (read this first)

| | **HOVIN (correct)** | **Expo Go (wrong for this product)** |
| --- | --- | --- |
| What you launch | Native app **`HOVIN`** / bundle `com.hotelsvendors.hovin` | The purple **Expo Go** app from the App Store |
| How you build it | `npm run ios` or Xcode → `mobile/ios/HOVIN.xcworkspace` | Scanning a Metro QR into Expo Go |
| Where it lives | Repo folder `mobile/` (Expo SDK + custom native project under `mobile/ios`) | A generic Expo client that does **not** include HOVIN’s native modules |

**Do not use Expo Go.** HOVIN is a custom native client (camera, SQLite, Secure Store, Reanimated, Clerk native, Xcode 27 plugins). Opening Expo Go, or scanning `npm start` into Expo Go, will look empty, crash, or show the wrong product. The home-screen / simulator icon must say **HOVIN**, not Expo Go.

If the simulator shows nothing: confirm the running process is `com.hotelsvendors.hovin` (`xcrun simctl listapps booted | rg hovin`), not Expo Go.

## What the Xcode screenshot usually means

| Symptom | Likely meaning |
| --- | --- |
| Status **Building • 451/455** with only yellow warnings | Often still linking. `ios.buildReactNativeFromSource=true` makes late steps slow (minutes), not dead. |
| Issue navigator: React-cxxreact “no symbols”, Hermes CDPHandler / integer precision | Inherited React Native / CocoaPods noise. **Non-fatal** unless the build ends with a red error. |
| App opens to **No script URL provided** or a blank charcoal screen | Debug scheme skips embedding JS. Metro is not running — start `npm start`, then relaunch **HOVIN** (not Expo Go). |
| Config / setup copy instead of phone home | Missing `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (or set `EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1` for the watermarked gallery). |
| Simulator stuck / “doesn’t work” with an Apple Account sheet | Host simulator state, not an HOVIN binary failure. Dismiss or skip the Apple ID prompt, then relaunch. |
| Git branch `cursor/eseal-local-signer-d37d` in Xcode | Wrong line for current HOVIN phone work. Use the HOVIN PR stack below. |
| You opened **Expo Go** | Wrong client — quit Expo Go and run `npm run ios` so **HOVIN.app** installs. |

Verified earlier on this Mac setup: Xcode 27.1 Release simulator build with `CODE_SIGNING_ALLOWED=NO` produced `HOVIN.app` with an embedded `main.jsbundle`, and `com.hotelsvendors.hovin` launched on **iPhone 17 Pro**.

## Correct branch and folder

```bash
cd /Users/Moatazi/hotels-vendors-new   # official workspace from AGENTS.md
git fetch origin
git checkout cursor/hovin-simulator-fix-168e   # or cursor/hovin-intelligence-168e once merged
cd mobile
```

Open **`mobile/ios/HOVIN.xcworkspace`**, never the bare `.xcodeproj`, when using the Xcode GUI.

## One-time Mac pins (fixes GUI hangs)

Xcode GUI builds often have an empty PATH, so Node is missing and script phases stall near the end of the build.

```bash
cd mobile
node -e "console.log(process.execPath)"
# Example output: /opt/homebrew/bin/node

cat > ios/.xcode.env.local <<'EOF'
export NODE_BINARY=/opt/homebrew/bin/node
EOF
# Replace with the absolute path printed above (nvm/fnm/volta paths are fine).
```

Then:

```bash
npm ci
npx pod-install
# or: cd ios && pod install && cd ..
node scripts/ios-sim-doctor.mjs
```

## Preferred launch (CLI, Debug + Metro)

```bash
cd mobile
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…   # or rely on repo-root .env.local NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
export EXPO_PUBLIC_HOVIN_API_ORIGIN=https://www.hotelsvendors.com

# Terminal A — Metro (required for Debug)
npm start

# Terminal B — native build + install
npm run ios
# equivalent: npx expo run:ios --device "iPhone 17 Pro"
```

Watermarked UI-only gallery (no Clerk):

```bash
export EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1
npm start
# other terminal:
npm run ios
```

## Packaged smoke test (no Metro)

Debug intentionally sets `SKIP_BUNDLING=1`. For a self-contained binary:

```bash
cd mobile
npx expo run:ios --configuration Release --device "iPhone 17 Pro"
```

Or in Xcode: Product → Scheme → Edit Scheme → Run → Build Configuration → **Release**, then Run.

## If stuck at 451/455

1. Wait 5–15 minutes on first cold build (RN compiled from source).
2. Open the Report navigator (speech-bubble / clock icon) and select the running build — look for a red **error**, not only yellow warnings.
3. Confirm `ios/.xcode.env.local` has a working `NODE_BINARY`.
4. Quit Simulator, dismiss any Apple Account Verification sheet, boot again:
   ```bash
   xcrun simctl shutdown all
   xcrun simctl boot "iPhone 17 Pro"
   open -a Simulator
   ```
5. Clean and rebuild once:
   ```bash
   cd mobile
   rm -rf ios/build "$HOME/Library/Developer/Xcode/DerivedData"/HOVIN-*
   npx pod-install
   npx expo run:ios --device "iPhone 17 Pro"
   ```

## Do not change for this symptom

- Do not treat React Native “no symbols” / Hermes precision warnings as the root cause.
- Do not remove `with-xcode27-fmt-fix` or `with-ios-script-sandboxing` — they keep Xcode 27 / CocoaPods scripts working.
- Do not set `buildReactNativeFromSource` to false on this Xcode 27 line unless you re-verify prebuilt RNCore on that exact toolchain.

## Related docs

- `docs/hovin-production-release.md` — EAS / store path
- `docs/hovin-motion-system.md` — Reanimated rebuild note
- `HANDOVER.md` — last verified simulator evidence
