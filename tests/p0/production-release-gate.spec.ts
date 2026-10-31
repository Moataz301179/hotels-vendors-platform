import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/deploy-production.yml", "utf8");
const launcher = readFileSync("deploy/pm2/start-protected.sh", "utf8");

describe("production release gate", () => {
  it("requires a manual dispatch and verifies the running source identity", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
    expect(workflow).toContain("- run: npm test");
    expect(workflow).toContain('HV_RELEASE_ID="github-${GITHUB_SHA}"');
    expect(workflow).toContain('HV_SOURCE_SHA="$GITHUB_SHA"');
    expect(workflow).toContain('sourceCommit !== expectedSha');
    expect(workflow).toContain('releaseId !== `github-${expectedSha}`');
    expect(workflow).toContain('health.ok !== true');
    expect(workflow).toContain('health.authorization !== "configured"');
  });

  it("builds and runs the release with the protected production Clerk credentials", () => {
    expect(workflow).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}');
    expect(workflow).toContain('CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}');
    expect(workflow).toContain('HV_RUNTIME_ENV_FILE="$RELEASE/.runtime-env"');
    expect(workflow).toContain('pk_live_');
    expect(launcher).toContain("exec node server.js");
    expect(launcher).not.toContain(".next/standalone/server.js");
  });

  it("pins the VPS SSH host key and verifies public TLS without insecure bypasses", () => {
    expect(workflow).toContain('VPS_SSH_HOST_KEY: ${{ secrets.VPS_SSH_HOST_KEY }}');
    expect(workflow).toContain('ssh-keygen -F "$VPS_HOST" -f ~/.ssh/known_hosts');
    expect(workflow).not.toContain('ssh-keyscan -H "$VPS_HOST"');
    expect(workflow).toContain("curl --fail --silent --show-error --proto '=https' --tlsv1.2 https://www.hotelsvendors.com/api/health");
    expect(workflow).toContain("curl --fail --silent --show-error --proto '=https' --tlsv1.2 --head --max-time 20 https://www.hotelsvendors.com/");
    expect(workflow).not.toContain('curl -ks');
  });
});
