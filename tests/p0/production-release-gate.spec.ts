import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/deploy-production.yml", "utf8");

describe("production release gate", () => {
  it("requires a manual dispatch and verifies the running source identity", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
    expect(workflow).toContain("- run: npm test");
    expect(workflow).toContain('HV_RELEASE_ID="github-${GITHUB_SHA}"');
    expect(workflow).toContain('HV_SOURCE_SHA="$GITHUB_SHA"');
    expect(workflow).toContain('sourceCommit !== expectedSha');
    expect(workflow).toContain('releaseId !== `github-${expectedSha}`');
  });
});
