import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const roadmap = JSON.parse(readFileSync(resolve(root, "data/build/venture-roadmap-2026-10-06.json"), "utf8"));
const run = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const branch = run(["branch", "--show-current"]);
const head = run(["rev-parse", "HEAD"]);
const dirtyPaths = run(["status", "--short"]).split("\n").filter(Boolean).length;
let strictTypeScript = { status: "not_run", diagnostics: null };
try {
  execFileSync("./node_modules/.bin/tsc", ["--noEmit", "--incremental", "false", "--pretty", "false"], { cwd: root, stdio: "ignore" });
  strictTypeScript = { status: "passed", diagnostics: 0 };
} catch {
  strictTypeScript = { status: "failed", diagnostics: null };
}
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), root, branch, head, dirtyPaths, strictTypeScript, roadmap }, null, 2));
