import { describe, expect, it } from "vitest";
import { OpportunityCreateSchema, OpportunityUpdateSchema, SavingsCreateSchema, SavingsUpdateSchema, OpportunityConvertSchema } from "../../lib/zod";

const schemas = [
  { name: "opportunity create", schema: OpportunityCreateSchema, base: { type: "PRICE_DRIFT", title: "Test finding" } },
  { name: "opportunity update", schema: OpportunityUpdateSchema, base: {} },
  { name: "savings create", schema: SavingsCreateSchema, base: { type: "NEGOTIATED" } },
  { name: "savings update", schema: SavingsUpdateSchema, base: {} },
  { name: "opportunity conversion", schema: OpportunityConvertSchema, base: {} },
];
describe("Zod4 evidence dictionary compatibility", () => {
  it.each(schemas)("$name preserves arbitrary string-keyed evidence", ({ schema, base }) => {
    const evidence = { reference: "test-only", amount: 12, nested: { verified: false }, nullable: null };
    const result = schema.safeParse({ ...base, evidence });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.evidence).toEqual(evidence);
  });
  it.each(schemas)("$name rejects an array instead of a dictionary", ({ schema, base }) => {
    expect(schema.safeParse({ ...base, evidence: ["not-a-dictionary"] }).success).toBe(false);
  });
  it("preserves realized-result records without accepting scalar values", () => {
    expect(OpportunityUpdateSchema.safeParse({ realizedResult: { reference: "test", confirmed: false } }).success).toBe(true);
    expect(OpportunityUpdateSchema.safeParse({ realizedResult: "not-a-dictionary" }).success).toBe(false);
  });
});
