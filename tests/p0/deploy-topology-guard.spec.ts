import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = join(process.cwd(), ".github/workflows/deploy-production.yml");
const workflow = readFileSync(workflowPath, "utf8");
const guardStart = workflow.indexOf('if ! printf \'%s\\n\' "$nginx_topology" | awk \'');
const guardEnd = workflow.indexOf("\n          '; then", guardStart);

if (guardStart === -1 || guardEnd === -1) {
  throw new Error("Could not locate the production Nginx topology guard in deploy-production.yml");
}

const awkProgram = workflow
  .slice(guardStart + 'if ! printf \'%s\\n\' "$nginx_topology" | awk \''.length, guardEnd)
  .replace(/^          /gm, "");

function guardResult(nginxTopology: string) {
  return spawnSync("awk", [awkProgram], {
    encoding: "utf8",
    input: nginxTopology,
  });
}

function expectTopology(nginxTopology: string, expectedStatus: number) {
  const result = guardResult(nginxTopology);
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(expectedStatus);
}

describe("production Nginx topology guard", () => {
  it("executes the workflow guard before the governed health gate", () => {
    expect(workflow.indexOf('if ! printf \'%s\\n\' "$nginx_topology" | awk \'')).toBeLessThan(
      workflow.indexOf("verify_active_release()"),
    );
  });

  it("accepts a direct proxy route to port 3008", () => {
    expectTopology(
      `server {
        location / { proxy_pass http://127.0.0.1:3008; }
      }`,
      0,
    );
  });

  it("accepts a single-line nextjs upstream routed to port 3008", () => {
    expectTopology(
      `upstream nextjs { server 127.0.0.1:3008; }
       server { location / { proxy_pass http://nextjs; } }`,
      0,
    );
  });

  it("accepts a multi-line nextjs upstream routed to port 3008", () => {
    expectTopology(
      `upstream nextjs {
         server localhost:3008 max_fails=3;
       }
       server {
         location / {
           proxy_pass http://nextjs;
         }
       }`,
      0,
    );
  });

  it.each([
    ["a direct proxy on a non-governed port", `proxy_pass http://127.0.0.1:3057;`],
    ["a nextjs upstream on a non-governed port", `upstream nextjs { server 127.0.0.1:3057; }\nproxy_pass http://nextjs;`],
    ["missing routing", `server { listen 443 ssl; }`],
    ["a look-alike upstream name", `upstream nextjs-shadow { server 127.0.0.1:3008; }\nproxy_pass http://nextjs-shadow;`],
    ["an unrelated upstream on port 3008", `upstream catalog { server 127.0.0.1:3008; }\nproxy_pass http://catalog;`],
  ])("rejects %s", (_scenario, nginxTopology) => {
    expectTopology(nginxTopology, 1);
  });
});
