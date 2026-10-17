import { describe, expect, it } from "vitest";
import { assistantFailureMessage } from "@/components/ai-assistant/base-onboarding-chatbot";

describe("assistant chatbot failure messages", () => {
  it("does not present an authorization response as a connection failure", () => {
    expect(assistantFailureMessage(new Error("SIGN_IN_REQUIRED"))).toContain("Sign in");
    expect(assistantFailureMessage(new Error("SIGN_IN_REQUIRED"))).not.toContain("temporarily unavailable");
  });

  it("keeps unavailable-provider responses distinct from sign-in requirements", () => {
    expect(assistantFailureMessage(new Error("HTTP 503"))).toContain("temporarily unavailable");
  });
});
