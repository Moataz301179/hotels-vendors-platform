#!/usr/bin/env node
/**
 * HOVIN production-release readiness gate.
 * Exit 0 only when repo + env gates required for a store-bound build are present.
 * Does not claim App Store / Play publication succeeded.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appJson = JSON.parse(readFileSync(resolve(root, "app.json"), "utf8"));
const easJsonPath = resolve(root, "eas.json");
const failures = [];
const warnings = [];

function req(cond, message) {
  if (!cond) failures.push(message);
}

function warn(cond, message) {
  if (!cond) warnings.push(message);
}

req(existsSync(easJsonPath), "mobile/eas.json is missing");
req(appJson.expo?.ios?.bundleIdentifier === "com.hotelsvendors.hovin", "iOS bundle id must be com.hotelsvendors.hovin");
req(appJson.expo?.android?.package === "com.hotelsvendors.hovin", "Android package must be com.hotelsvendors.hovin");
req(appJson.expo?.version, "expo.version is required");
req(existsSync(resolve(root, "assets/icon.png")), "assets/icon.png missing");
req(existsSync(resolve(root, "assets/adaptive-icon.png")), "assets/adaptive-icon.png missing");
req(existsSync(resolve(root, "babel.config.js")), "babel.config.js missing (Reanimated plugin required)");

const plugins = appJson.expo?.plugins ?? [];
req(!plugins.includes("react-native-reanimated"), "Do not list react-native-reanimated under expo.plugins (no app.plugin.js)");

const projectId = appJson.expo?.extra?.eas?.projectId;
req(projectId && projectId !== "REPLACE_WITH_EAS_PROJECT_ID", "Set expo.extra.eas.projectId after `eas init`");

warn(Boolean(process.env.EXPO_TOKEN), "EXPO_TOKEN not set — EAS cloud builds cannot authenticate");
warn(Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY), "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY not set");
warn(Boolean(process.env.EXPO_PUBLIC_HOVIN_API_ORIGIN), "EXPO_PUBLIC_HOVIN_API_ORIGIN not set");
warn(Boolean(process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL), "NEXT_PUBLIC_IOS_DOWNLOAD_URL unset — /hovin will not show a live App Store link");
warn(Boolean(process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL), "NEXT_PUBLIC_ANDROID_DOWNLOAD_URL unset — /hovin will not show a live Play link");

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
req(Boolean(pkg.dependencies?.["react-native-reanimated"]), "react-native-reanimated must be a production dependency");
req(Boolean(pkg.dependencies?.["react-native-gesture-handler"]), "react-native-gesture-handler must be a production dependency");

console.log("HOVIN release readiness");
for (const w of warnings) console.log(`  warn  ${w}`);
for (const f of failures) console.log(`  fail  ${f}`);

if (failures.length) {
  console.log(`\nBLOCKED: ${failures.length} required gate(s) failed.`);
  process.exit(1);
}

console.log("\nPASS: repository gates for an EAS production build profile are present.");
console.log("Still required outside this script: Apple/Google signing, EAS build, store submit, Neon migration approval, merge to main.");
process.exit(0);
