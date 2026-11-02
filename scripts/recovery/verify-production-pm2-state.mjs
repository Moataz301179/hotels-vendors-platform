#!/usr/bin/env node
/**
 * Fail-closed validation of the one production PM2 process before and after
 * activation. The legacy start-with-env launcher is accepted only as the
 * already-running predecessor; every new activation must use start-protected.
 */
import { existsSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, join, resolve } from "node:path";

export function validateProductionPm2State({
  processes,
  releaseRoot = "/var/www/hv-releases",
  port = 3008,
  phase = "predeploy",
  expectedSha = null,
  listenerPids,
  health,
  fileExists = existsSync,
  realpath = realpathSync,
}) {
  if (!Array.isArray(processes)) throw new Error("PM2 process inventory is invalid");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Production port is invalid");
  if (phase !== "predeploy" && phase !== "postactivation") throw new Error("Validation phase is invalid");
  if (phase === "postactivation" && !/^[a-f0-9]{40}$/.test(expectedSha ?? "")) {
    throw new Error("Expected release commit is invalid");
  }

  const matches = processes.filter((process) => process?.name === "hotels-vendors-production");
  if (matches.length !== 1) throw new Error("Expected exactly one production PM2 process");
  const process = matches[0];
  const env = process.pm2_env ?? {};
  const pid = Number(process.pid);
  if (env.status !== "online" || !Number.isSafeInteger(pid) || pid <= 0) {
    throw new Error("Production PM2 process is not online with a valid PID");
  }

  const root = realpath(resolve(releaseRoot));
  const cwd = resolve(env.pm_cwd ?? "");
  let canonicalCwd = null;
  try {
    canonicalCwd = realpath(cwd);
  } catch {
    // Normalize missing paths into a closed identity failure without exposing
    // filesystem details in workflow logs.
  }
  if (cwd !== env.pm_cwd || canonicalCwd !== cwd || !cwd.startsWith(`${root}/`)) {
    throw new Error("Production PM2 cwd is not a canonical release path");
  }
  const releaseId = basename(cwd);
  const sourceSha = releaseId.startsWith("github-") ? releaseId.slice("github-".length) : "";
  if (!/^[a-f0-9]{40}$/.test(sourceSha) || cwd !== join(root, `github-${sourceSha}`)) {
    throw new Error("Production release directory does not encode a full commit SHA");
  }
  if (expectedSha !== null && sourceSha !== expectedSha) {
    throw new Error("Activated release does not match the requested commit");
  }

  const protectedLauncher = join(cwd, "deploy/pm2/start-protected.sh");
  const legacyLauncher = join(cwd, "deploy/pm2/start-with-env.sh");
  const execPath = resolve(env.pm_exec_path ?? "");
  const isProtected = execPath === protectedLauncher;
  const isLegacyPredecessor = phase === "predeploy" && execPath === legacyLauncher;
  if (!isProtected && !isLegacyPredecessor) {
    throw new Error(phase === "postactivation"
      ? "Activated production process must use start-protected.sh"
      : "Production process uses an unrecognized launcher");
  }
  const hasEnv = fileExists(join(cwd, ".env"));
  const hasRuntimeEnv = fileExists(join(cwd, ".runtime-env"));
  if (!hasRuntimeEnv || !fileExists(execPath) || (phase === "postactivation" && !hasEnv)) {
    throw new Error("Production release is missing its runtime files or launcher");
  }

  const uniqueListenerPids = [...new Set((listenerPids ?? []).map(Number))];
  if (uniqueListenerPids.length !== 1 || uniqueListenerPids[0] !== pid) {
    throw new Error("The production port is not owned by the expected PM2 process");
  }

  if (health?.ok !== true || health?.database !== "ready" || health?.authorization !== "configured") {
    throw new Error("The active production health check failed");
  }
  if (health?.sourceCommit !== sourceSha || health?.releaseId !== `github-${sourceSha}`) {
    throw new Error("The active process health identity does not match its release directory");
  }

  return {
    name: process.name,
    pid,
    port,
    releaseDir: cwd,
    releaseId,
    sourceSha,
    execPath,
    launcher: isProtected ? "start-protected.sh" : "start-with-env.sh",
    phase,
  };
}

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 10_000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error("A required read-only production identity probe failed");
  return result.stdout;
}

async function main() {
  const phase = argument("--phase", "predeploy");
  const portText = argument("--port", "3008");
  const port = Number(portText);
  const releaseRoot = argument("--release-root", "/var/www/hv-releases");
  const expectedSha = argument("--expected-sha");
  const processes = JSON.parse(run("pm2", ["jlist"]));
  const listenerOutput = run("ss", ["-H", "-ltnp", `sport = :${port}`]);
  const listenerPids = [...listenerOutput.matchAll(/pid=(\d+)/g)].map((match) => Number(match[1]));
  const healthResponse = await fetch(`http://127.0.0.1:${port}/api/health`, {
    signal: AbortSignal.timeout(8_000),
  });
  if (!healthResponse.ok) throw new Error("The active production health endpoint is unavailable");
  const health = await healthResponse.json();
  const state = validateProductionPm2State({
    processes,
    releaseRoot,
    port,
    phase,
    expectedSha,
    listenerPids,
    health,
  });
  process.stdout.write(`${JSON.stringify(state)}\n`);
}

if (process.argv[1] === "-" || process.argv[1] === import.meta.url.slice("file://".length)) {
  main().catch((error) => {
    process.stderr.write(`Production process validation refused: ${error.message}\n`);
    process.exitCode = 1;
  });
}
