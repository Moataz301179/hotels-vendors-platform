import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = join(process.cwd(), ".github/workflows/deploy-production.yml");

function activationRemoteScript(): string {
  const extraction = spawnSync(
    "ruby",
    [
      "-ryaml",
      "-e",
      `workflow = YAML.load_file(ARGV.fetch(0))
step = workflow.fetch("jobs").fetch("deploy").fetch("steps").find { |entry| entry["name"] == "Activate release and verify" }
abort "activation step not found" unless step
remote = step.fetch("run").split("<<'REMOTE'\\n", 2).fetch(1).sub(/\\nREMOTE\\s*\\z/, "\\n")
print remote`,
      workflowPath,
    ],
    { encoding: "utf8" },
  );

  expect(extraction.error).toBeUndefined();
  expect(extraction.status, extraction.stderr).toBe(0);
  return extraction.stdout;
}

describe("production activation shell syntax", () => {
  // Ruby starts a fresh process to parse the checked-in workflow. On a busy
  // native/mobile build host its cold start can exceed Vitest's 10s default;
  // retain the syntax assertion while allowing a bounded, deterministic
  // subprocess window rather than treating host contention as a deploy-shell
  // failure.
  it("parses the exact YAML-rendered remote script before it can reach the VPS", () => {
    const remoteScript = activationRemoteScript();
    expect(remoteScript).toContain("verify_active_release()");
    expect(remoteScript).toContain("verify_process_identity()");
    expect(remoteScript).toContain('verify_process_identity predeploy "$ACTIVE_SOURCE_SHA"');
    expect(remoteScript).toContain('verify_process_identity postactivation "$GITHUB_SHA"');
    expect(remoteScript).toContain("VERIFY_PREFLIGHT_CSP");

    const syntax = spawnSync("bash", ["-n"], {
      encoding: "utf8",
      input: remoteScript,
    });
    expect(syntax.error).toBeUndefined();
    expect(syntax.status, syntax.stderr).toBe(0);
  }, 30_000);

  it("keeps the activation step in the checked-in workflow", () => {
    expect(readFileSync(workflowPath, "utf8")).toContain("- name: Activate release and verify");
  });
});
