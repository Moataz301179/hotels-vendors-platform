import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const launcher = join(process.cwd(), "deploy/pm2/start-protected.sh");

describe("protected staging launcher", () => {
  it("passes protected runtime settings into the application process", () => {
    const sandbox = mkdtempSync(join(tmpdir(), "hv-protected-launcher-"));
    try {
      const runtimeFile = join(sandbox, "runtime.env");
      const nodeStub = join(sandbox, "node");
      writeFileSync(runtimeFile, "CLERK_SECRET_KEY=clerk-test-fixture\nDATABASE_URL=postgres-test-fixture\n", { mode: 0o600 });
      writeFileSync(
        nodeStub,
        "#!/bin/sh\nprintf '%s|%s' \"${CLERK_SECRET_KEY-unset}\" \"${DATABASE_URL-unset}\"\n",
        { mode: 0o700 },
      );
      chmodSync(nodeStub, 0o700);

      const result = spawnSync("bash", [launcher], {
        cwd: sandbox,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${sandbox}:${process.env.PATH ?? ""}`,
          HV_RUNTIME_ENV_FILE: runtimeFile,
          HV_RELEASE_ID: "staging-test-release",
          HV_SOURCE_SHA: "staging-test-sha",
          PORT: "3060",
        },
      });

      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("clerk-test-fixture|postgres-test-fixture");
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
