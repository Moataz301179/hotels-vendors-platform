import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateProductionPm2State } from "../../scripts/recovery/verify-production-pm2-state.mjs";

const sha = "c6d1ad06c8e6df56232d84a87993d9a288fb17b7";
const pid = 2145;

describe("production PM2 predecessor identity gate", () => {
  let root = "";
  let cwd = "";
  let protectedLauncher = "";
  let legacyLauncher = "";

  function fixture(launcher: "start-protected.sh" | "start-with-env.sh" = "start-with-env.sh") {
    root = mkdtempSync(join(tmpdir(), "hv-pm2-identity-"));
    cwd = join(root, `github-${sha}`);
    protectedLauncher = join(cwd, "deploy/pm2/start-protected.sh");
    legacyLauncher = join(cwd, "deploy/pm2/start-with-env.sh");
    mkdirSync(join(cwd, "deploy/pm2"), { recursive: true });
    writeFileSync(join(cwd, ".env"), "");
    writeFileSync(join(cwd, ".runtime-env"), "");
    writeFileSync(protectedLauncher, "#!/usr/bin/env bash\n");
    writeFileSync(legacyLauncher, "#!/usr/bin/env bash\n");
    return {
      releaseRoot: root,
      processes: [{
        name: "hotels-vendors-production",
        pid,
        pm2_env: {
          status: "online",
          pm_cwd: cwd,
          pm_exec_path: launcher === "start-protected.sh" ? protectedLauncher : legacyLauncher,
        },
      }],
      listenerPids: [pid],
      health: { ok: true, database: "ready", authorization: "configured", sourceCommit: sha, releaseId: `github-${sha}` },
    };
  }

  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it("accepts the canonical legacy wrapper only as a healthy predeployment predecessor", () => {
    const state = validateProductionPm2State(fixture());
    expect(state).toMatchObject({ launcher: "start-with-env.sh", phase: "predeploy", sourceSha: sha, port: 3008 });
  });

  it("accepts a protected process before deployment and as the only postactivation wrapper", () => {
    const state = validateProductionPm2State({
      ...fixture("start-protected.sh"),
      phase: "postactivation",
      expectedSha: sha,
    });
    expect(state).toMatchObject({ launcher: "start-protected.sh", phase: "postactivation", sourceSha: sha });
  });

  it("rejects the legacy wrapper after activation", () => {
    expect(() => validateProductionPm2State({
      ...fixture("start-with-env.sh"),
      phase: "postactivation",
      expectedSha: sha,
    })).toThrow("Activated production process must use start-protected.sh");
  });

  it("rejects a listener owned by a different process", () => {
    expect(() => validateProductionPm2State({ ...fixture(), listenerPids: [pid + 1] }))
      .toThrow("The production port is not owned by the expected PM2 process");
  });

  it("rejects duplicate production PM2 names and ambiguous listeners", () => {
    const current = fixture();
    expect(() => validateProductionPm2State({ ...current, processes: [...current.processes, ...current.processes] }))
      .toThrow("Expected exactly one production PM2 process");
    expect(() => validateProductionPm2State({ ...fixture(), listenerPids: [pid, pid + 1] }))
      .toThrow("The production port is not owned by the expected PM2 process");
  });

  it("rejects path, health, and commit identity mismatches", () => {
    const current = fixture();
    expect(() => validateProductionPm2State({
      ...current,
      processes: [{ ...current.processes[0], pm2_env: { ...current.processes[0].pm2_env, pm_cwd: join(root, "github-short") } }],
    })).toThrow("Production PM2 cwd is not a canonical release path");
    expect(() => validateProductionPm2State({ ...fixture(), health: { ...current.health, sourceCommit: "0".repeat(40) } }))
      .toThrow("The active process health identity does not match its release directory");
    expect(() => validateProductionPm2State({ ...fixture("start-protected.sh"), phase: "postactivation", expectedSha: "0".repeat(40) }))
      .toThrow("Activated release does not match the requested commit");
  });

  it("wires predeployment predecessor validation and protected postactivation validation into deploy", () => {
    const workflow = readFileSync(".github/workflows/deploy-production.yml", "utf8");
    expect(workflow).toContain("scripts/recovery/verify-production-pm2-state.mjs");
    expect(workflow).toContain("verify_process_identity predeploy");
    expect(workflow).toContain('verify_process_identity postactivation "$GITHUB_SHA"');
    expect(workflow).toContain('pm2 start "$RELEASE/deploy/pm2/start-protected.sh"');
    expect(workflow).not.toContain('test "$ACTIVE_EXEC" = "$ACTIVE_RELEASE/deploy/pm2/start-protected.sh"');
  });
});
