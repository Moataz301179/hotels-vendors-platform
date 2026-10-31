import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ETA deployment secret handling", () => {
  it("forwards ETA configuration only from GitHub Secrets into the protected runtime file", async () => {
    const workflow = await readFile(resolve(process.cwd(), ".github/workflows/deploy-production.yml"), "utf8");
    for (const name of ["ETA_API_URL", "ETA_IDENTITY_URL", "ETA_CLIENT_ID", "ETA_CLIENT_SECRET", "ETA_CALLBACK_API_KEY", "ETA_REGISTRATION_NUMBER"]) {
      expect(workflow).toContain(`${name}: \${{ secrets.${name} }}`);
      expect(workflow).toContain(`printf '${name}=%q\\n' "$${name}"`);
    }
    expect(workflow).toContain("ETA_ENVIRONMENT: ${{ vars.ETA_ENVIRONMENT }}");
    expect(workflow).toContain("ETA_SUBMISSION_ENABLED: ${{ vars.ETA_SUBMISSION_ENABLED }}");
    expect(workflow).toContain('case "$ETA_ENVIRONMENT" in preprod|production)');
    expect(workflow).toContain('case "$ETA_SUBMISSION_ENABLED" in true|false|"")');
    expect(workflow).not.toContain("ETA_PRIVATE_KEY");
  });
});
