import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const script = join(process.cwd(), "scripts/reconcile-nginx-csp.mjs");
const legacyConfig = `server {
  proxy_hide_header Content-Security-Policy;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';" always;
  proxy_pass http://nextjs;
}
`;

describe("Nginx CSP reconciliation", () => {
  it("removes only the legacy CSP override through a site-enabled symlink and keeps a backup", () => {
    const root = mkdtempSync(join(tmpdir(), "hv-nginx-csp-"));
    const target = join(root, "hotelsvendors.com");
    const enabled = join(root, "sites-enabled-hotelsvendors.com");
    const backup = join(root, "backup.conf");
    writeFileSync(target, legacyConfig);
    symlinkSync(target, enabled);

    execFileSync("node", [script, enabled, backup], { encoding: "utf8" });

    expect(readFileSync(backup, "utf8")).toBe(legacyConfig);
    expect(readFileSync(target, "utf8")).toContain("proxy_pass http://nextjs;");
    expect(readFileSync(target, "utf8")).not.toContain("Content-Security-Policy");
  });

  it("accepts an already-clean configuration without changing it", () => {
    const root = mkdtempSync(join(tmpdir(), "hv-nginx-csp-"));
    const target = join(root, "hotelsvendors.com");
    const backup = join(root, "backup.conf");
    const clean = "server { proxy_pass http://nextjs; }\n";
    writeFileSync(target, clean);

    const output = execFileSync("node", [script, target, backup], { encoding: "utf8" });
    expect(JSON.parse(output)).toMatchObject({ ok: true, alreadyClean: true, changed: { proxyHideHeader: 0, addHeader: 0 } });
    expect(readFileSync(target, "utf8")).toBe(clean);
  });

  it("refuses a partial legacy override without changing it", () => {
    const root = mkdtempSync(join(tmpdir(), "hv-nginx-csp-"));
    const target = join(root, "hotelsvendors.com");
    const backup = join(root, "backup.conf");
    const partial = `server {
  proxy_hide_header Content-Security-Policy;
  proxy_pass http://nextjs;
}
`;
    writeFileSync(target, partial);

    expect(() => execFileSync("node", [script, target, backup], { encoding: "utf8", stdio: "pipe" })).toThrow();
    expect(readFileSync(target, "utf8")).toBe(partial);
  });
});
