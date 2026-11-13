import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("AI procurement assistant widget contract", () => {
  const source = readFileSync(join(process.cwd(), "components/ai-assistant/base-onboarding-chatbot.tsx"), "utf8");

  it("sends question text instead of a React message object", () => {
    expect(source).toContain("question: userMsg.content");
    expect(source).not.toContain("question: userMsg, messages");
  });

  it("labels the floating widget as AI Assistant and keeps the public privacy notice", () => {
    expect(source).toContain("Open HOTELSVENDORS AI Assistant");
    expect(source).toContain("Public guidance never accesses organization records.");
    expect(source).not.toContain("Powered by HOTELSVENDORS Intelligence Engine (Ollama llama3.2)");
  });

  it("renders navigation actions returned by the assistant API", () => {
    expect(source).toContain("payload.actions");
    expect(source).toContain("action.href");
  });
});
