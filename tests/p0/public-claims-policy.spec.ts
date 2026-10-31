import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { findUnsupportedPublicClaims } from "@/lib/marketing/public-claims-policy";

const root = process.cwd();
const marketingRoot = join(root, "app", "(marketing)");
const ALLOWED_RENDER_ROOTS = [
  join(root, "app", "(marketing)"),
  join(root, "components", "marketing"),
  join(root, "components", "ai-assistant"),
];

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? routeFiles(path) : entry.name.endsWith(".tsx") ? [path] : [];
  });
}

function resolveImport(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? join(root, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(from, "..", specifier)
      : null;
  if (!base) return null;

  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, join(base, "index.tsx"), join(base, "index.ts")]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function activeMarketingSources(): string[] {
  const pending = routeFiles(marketingRoot);
  const visited = new Set<string>();

  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      const imported = resolveImport(file, match[1]);
      if (imported && ALLOWED_RENDER_ROOTS.some((allowed) => imported.startsWith(allowed))) pending.push(imported);
    }
  }

  return [...visited].filter((file) => ALLOWED_RENDER_ROOTS.some((allowed) => file.startsWith(allowed)) && [".ts", ".tsx"].includes(extname(file)));
}

describe("public marketing claims policy", () => {
  it("rejects the prohibited promise families", () => {
    expect(findUnsupportedPublicClaims("Join our bidding auction")).toEqual(expect.arrayContaining([{ family: "unsupported-bidding", match: "bidding" }]));
    expect(findUnsupportedPublicClaims("Get a 48-hour payout")).toEqual(expect.arrayContaining([{ family: "platform-payout-or-48-hour-promise", match: "48-hour" }]));
    expect(findUnsupportedPublicClaims("Live stock is available now")).toEqual(expect.arrayContaining([{ family: "live-stock-or-availability", match: "Live stock" }]));
    expect(findUnsupportedPublicClaims("ETA invoice accepted today")).toEqual(expect.arrayContaining([{ family: "eta-acceptance-or-compliance-claim", match: "ETA invoice accepted" }]));
  });

  it("allows controlled, external-party workflow language", () => {
    expect(findUnsupportedPublicClaims("External funding partners retain underwriting decisions. ETA-ready workflow.")).toEqual([]);
  });

  it("keeps every rendered marketing route and its rendered marketing components free of unsupported public claims", () => {
    const violations = activeMarketingSources().flatMap((file) =>
      findUnsupportedPublicClaims(readFileSync(file, "utf8")).map((violation) => ({
        file: relative(root, file),
        ...violation,
      })),
    );

    expect(violations).toEqual([]);
  });
});
