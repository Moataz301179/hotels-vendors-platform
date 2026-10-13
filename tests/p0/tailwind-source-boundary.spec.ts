import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globals = readFileSync("app/globals.css", "utf8");

describe("Tailwind source boundary", () => {
  it("scans only web application source and not adjacent workspace roots", () => {
    expect(globals).toContain("@import 'tailwindcss' source(none);");
    expect(globals).toContain('@source "../app";');
    expect(globals).toContain('@source "../components";');
    expect(globals).toContain('@source "../lib";');
  });
});
