# HOVIN mobile

Native **HOVIN** app — Expo SDK 54 / React Native 0.81, bundle `com.hotelsvendors.hovin`.

**Not Expo Go.** Do not open the Expo Go store app or scan Metro into it. Build and launch the HOVIN custom client with `npm run ios` (or Xcode on `ios/HOVIN.xcworkspace`). The simulator icon must read **HOVIN**.

## Quick start (Mac)

See **`../docs/hovin-simulator-runbook.md`**.

```bash
npm ci
npm run doctor:ios
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_…   # or EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1
export EXPO_PUBLIC_HOVIN_API_ORIGIN=https://www.hotelsvendors.com
npm start    # Terminal A — Metro for Debug
npm run ios  # Terminal B — installs/launches HOVIN.app (not Expo Go)
```

## Notes

- Debug builds need Metro. Release embeds the JS bundle (`npx expo run:ios --configuration Release`).
- `ios.buildReactNativeFromSource=true` makes first builds slow near the last compile/link steps.
- Pin `NODE_BINARY` in `ios/.xcode.env.local` before building from the Xcode GUI.
- Blank / “No script URL” usually means Metro is down or you launched Expo Go instead of HOVIN.
