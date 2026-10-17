import { describe, expect, it } from "vitest";
import { OperaConnector } from "@/lib/integration/connectors/OracleOpera";
import { SAPConnector } from "@/lib/integration/connectors/SAP";

describe("external integration connection boundary", () => {
  it("never fabricates OPERA hotel data while no authenticated connection exists", async () => {
    const connector = new OperaConnector({ ohipUrl: "", apiKey: "", propertyId: "hotel-1" });
    await expect(connector.getOccupancy("hotel-1", "2026-10-17")).rejects.toMatchObject({
      code: "INTEGRATION_CONNECTION_UNAVAILABLE",
      provider: "ORACLE_OPERA_CLOUD",
    });
  });

  it("never fabricates SAP financial or procurement data while no authenticated connection exists", async () => {
    const connector = new SAPConnector({ baseUrl: "", clientId: "", clientSecret: "", companyId: "company-1" });
    await expect(connector.getBudget("hotel-1", "hk", "2026-10")).rejects.toMatchObject({
      code: "INTEGRATION_CONNECTION_UNAVAILABLE",
      provider: "SAP",
    });
  });
});
