# HOVIN mobile

Expo SDK 54 / React Native 0.81 app (`com.hotelsvendors.hovin`).

## Quick start (Mac)

See **`../docs/hovin-simulator-runbook.md`**.

```bash
npm ci
npm run doctor:ios
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_…   # or EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1
export EXPO_PUBLIC_HOVIN_API_ORIGIN=https://www.hotelsvendors.com
npm start    # Terminal A
npm run ios  # Terminal B
```

## Notes

- Debug builds need Metro. Release embeds the JS bundle.
- `ios.buildReactNativeFromSource=true` makes first builds slow near the last compile/link steps.
- Pin `NODE_BINARY` in `ios/.xcode.env.local` before building from the Xcode GUI.
