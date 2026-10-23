import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(join(process.cwd(), ".github/workflows/recover-vps-migration.yml"), "utf8");

describe("read-only VPS recovery CSP inventory", () => {
  it("captures only CSP-owning Nginx directives alongside the source marker", () => {
    expect(workflow).toContain("=== nginx_csp_directives ===");
    expect(workflow).toContain("/^# configuration file / { source = $0; next }");
    expect(workflow).toContain("(add_header|more_set_headers|proxy_hide_header)[[:space:]]+content-security-policy");
  });

  it("captures cache declarations without mutating the VPS", () => {
    expect(workflow).toContain("=== nginx_cache_directives ===");
    expect(workflow).toContain("proxy_cache_path|proxy_cache|proxy_no_cache|proxy_cache_bypass|fastcgi_cache");
  });

  it("records the active Nginx command identity before any configuration repair", () => {
    expect(workflow).toContain("=== nginx_runtime_identity ===");
    expect(workflow).toContain("systemctl show nginx --property=ExecStart --property=ExecReload --no-pager");
    expect(workflow).toContain("nginx: master process");
  });

  it("keeps the inventory read-only", () => {
    expect(workflow).not.toMatch(/\bsed[[:space:]]+-i\b/);
    expect(workflow).not.toMatch(/\bnginx[[:space:]]+-s\b/);
    expect(workflow).not.toMatch(/\b(systemctl|pm2)[[:space:]]+(reload|restart|stop|start|save)\b/);
  });
});
