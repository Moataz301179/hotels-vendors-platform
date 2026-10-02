import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/hotel-data/**/*.spec.ts"],
    testTimeout: 20_000,
    sequence: { sequential: true },
  },
});
