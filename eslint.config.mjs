import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**", ".next-maintenance/**", ".next-maintenance-build/**",
    "out/**", "build/**", "next-env.d.ts", "node_modules/**",
    // Archived deployments and the separately tracked native project are not web source.
    "releases/**", "mobile/**",
  ]),
]);
