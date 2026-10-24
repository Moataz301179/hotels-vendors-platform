import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ETA deployment secret handling", () => {
  it("forwards ETA configuration only from GitHub Secrets into the protected runtime file", async () => {
    const workflow = await readFile(resolve(process.cwd(), ".github/workflows/deploy-production.yml"), "utf8");
    for (const name of ["ETA_API_URL", "ETA_IDENTITY_URL", "ETA_CLIENT_ID", "ETA_CLIENT_SECRET", "ETA_CALLBACK_API_KEY"]) {
      expect(workflow).toContain(`${name}: \${{ secrets.${name} }}`);
      expect(workflow).toContain(`printf '${name}=%q\\n' "$${name}"`);
    }
  });
});
