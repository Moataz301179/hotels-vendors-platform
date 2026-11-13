import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const carriers = readFileSync("app/(marketing)/solutions/carriers/page.tsx", "utf8");
const funders = readFileSync("app/(marketing)/solutions/funders/page.tsx", "utf8");
const about = readFileSync("app/(marketing)/about/page.tsx", "utf8");

describe("carriers and funders solutions honesty", () => {
  it("states what the carrier portal builds today without claiming live courier booking", () => {
    expect(carriers).toContain("Built today");
    expect(carriers).toContain("HOVIN delivery codes");
    expect(carriers).toContain("EGYPT_PROVIDERS");
    expect(carriers).toContain("Adapter planned");
    expect(carriers).toContain("Not connected yet");
    expect(carriers).toContain("Live booking against Bosta, Aramex, Mylerz");
    expect(carriers).toContain("live GPS feed from an external carrier network");
    expect(carriers).toContain("not yet switched on");
  });

  it("keeps funders on referral boundaries and names Oliv as non-live API", () => {
    expect(funders).toContain("HotelsVendors is not a lender");
    expect(funders).toContain("moneyMoved as false");
    expect(funders).toContain("Oliv Finance");
    expect(funders).toContain("Live API keys, webhooks, and production routes are not provisioned");
    expect(funders).toContain("empty connected set");
    expect(funders).not.toMatch(/HotelsVendors disburses/i);
  });

  it("recreates About with founder story and LinkedIn-grounded qualifications", () => {
    expect(about).toContain("Moataz Mohamed Abdel Ghani");
    expect(about).toContain("Bachelor of Accounting");
    expect(about).toContain("Alexandria University");
    expect(about).toContain("Deloitte");
    expect(about).toContain("Better Homes Qatar");
    expect(about).toContain("Al Manna Group");
    expect(about).toContain("Oliv Finance partner");
    expect(about).toContain("https://www.linkedin.com/in/moatazabdelghani");
    expect(about).toContain("does not lend");
  });
});
