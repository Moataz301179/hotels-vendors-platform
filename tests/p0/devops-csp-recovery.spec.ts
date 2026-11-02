import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const REPO = process.cwd();
const RECONCILE = `${REPO}/scripts/reconcile-nginx-csp.mjs`;

function run(nodeScript: string, args: string[]) {
  return spawnSync("node", [nodeScript, ...args], { encoding: "utf8", timeout: 30000 });
}

describe("DevOps recovery — CI workflow contract", () => {
  it("parses the CI workflow YAML and asserts the smoke-test homepage markers", () => {
    const yaml = readFileSync(join(REPO, ".github/workflows/ci.yml"), "utf8");
    expect(yaml).toContain("grep -Fq 'Run procurement like an operating system' /tmp/hv-home.html");
    expect(yaml).toContain("grep -Fq 'Every handoff, one record' /tmp/hv-home.html");
    expect(yaml).toContain("grep -Fq 'Sealed sourcing, approval authority' /tmp/hv-home.html");
  });

  it("parses the deploy workflow YAML and asserts the migration confirmation gate", () => {
    const yaml = readFileSync(join(REPO, ".github/workflows/deploy-production.yml"), "utf8");
    expect(yaml).toContain("production_migration_confirmation");
    expect(yaml).toContain("APPLY_AFTER_NEON_BACKUP");
    expect(yaml).toContain(".neon.tech");
    expect(yaml).toContain("sslmode=verify-full");
  });
});

describe("DevOps recovery — CSP reconciliation idempotency", () => {
  let dir: string;
  beforeEach(() => {
    dir = join(tmpdir(), `hv-csp-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("removes a complete legacy CSP override on first run", () => {
    const config = join(dir, "nginx.conf");
    const backup = join(dir, "backup.conf");
    writeFileSync(config, [
      "server {",
      "  listen 80;",
      "  proxy_hide_header Content-Security-Policy;",
      "  add_header Content-Security-Policy \"default-src 'self'\";",
      "}",
    ].join("\n"));
    const r = run(RECONCILE, [config, backup]);
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ ok: true, changed: { proxyHideHeader: 1, addHeader: 1 } });
    const cleaned = readFileSync(config, "utf8");
    expect(cleaned).not.toContain("proxy_hide_header Content-Security-Policy");
    expect(cleaned).not.toContain("add_header Content-Security-Policy");
  });

  it("is a no-op when the config is already clean", () => {
    const config = join(dir, "nginx.conf");
    const backup = join(dir, "backup.conf");
    writeFileSync(config, "server { listen 80; }\n");
    const r = run(RECONCILE, [config, backup]);
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ ok: true, alreadyClean: true });
  });

  it("fails closed on a partial legacy override", () => {
    const config = join(dir, "nginx.conf");
    const backup = join(dir, "backup.conf");
    writeFileSync(config, "  proxy_hide_header Content-Security-Policy;\n");
    const r = run(RECONCILE, [config, backup]);
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toContain("EXPECTED_ONE_LEGACY_CSP_DIRECTIVE_EACH");
  });
});