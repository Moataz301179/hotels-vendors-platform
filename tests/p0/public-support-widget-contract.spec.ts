import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("public support assistant widget contract", () => {
  const source = readFileSync(join(process.cwd(), "components/ai-assistant/support-chat.tsx"), "utf8");

  it("uses the supported v2 public-guidance contract instead of the removed legacy route", () => {
    expect(source).toContain('fetch("/api/v2/assistant"');
    expect(source).toContain("question: text");
    expect(source).not.toContain("/api/v1/ai/public");
  });

  it("does not send a client-authored support system prompt or stream a provider response", () => {
    expect(source).not.toContain("SUPPORT_PROMPT");
    expect(source).not.toContain("getReader()");
    expect(source).toContain("deterministic public guidance only");
  });

  it("keeps provider-unavailable handling explicit for future authenticated responses", () => {
    expect(source).toContain('code === "AI_PROVIDER_UNAVAILABLE"');
    expect(source).toContain("status === 503");
  });
});
