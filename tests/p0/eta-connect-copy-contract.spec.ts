import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Static copy-contract checks for the ETA Connect surfaces.
 * These assert the shipped source text, not a rendered page (the P0 suite runs
 * in a node environment). They are labelled as source-contract evidence.
 */
const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (relative: string) => readFileSync(`${root}/${relative}`, "utf8");

describe("ETA connect copy contract (ETA-002 / ETA-011 / MASTER-ETA-UI-001)", () => {
  it("does not send a client-supplied hotelId from the connect panel", () => {
    const panel = read("components/v2/eta-connect-panel.tsx");
    expect(panel).not.toMatch(/hotelId\s*:/);
  });

  it("distinguishes the hotel buyer's authorized ingest from the issuer e-seal", () => {
    const page = read("app/(marketing)/eta-connect/page.tsx");
    expect(page).toContain("hotel buyer needs authorized invoice ingest");
    expect(page).toContain("issuer");
    expect(page.toLowerCase()).toContain("e-seal");
  });

  it("keeps the regulatory boundary: no ETA endorsement and no blanket non-guarantee", () => {
    const notice = read("components/v2/regulatory-connection-notice.tsx");
    expect(notice).toContain("does not constitute ETA endorsement");
    expect(notice).toContain("not an issuer e-seal");
  });

  it("never describes a recorded intake as an active ETA connection", () => {
    const panel = read("components/v2/eta-connect-panel.tsx");
    expect(panel).toContain("not confirmation that an ETA connection is active");
    expect(panel).not.toMatch(/ETA connected|organization activated/);
  });
});
