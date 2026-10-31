/** Validates the HotelsVendors supplier-neutral procurement taxonomy plan. */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type Subcategory = { code?: unknown; targetSkus?: unknown };
type Category = { code?: unknown; targetSkus?: unknown; subcategories?: unknown };

export function validateSubtaxonomy(payload: { categories?: unknown }): string[] {
  const errors: string[] = [];
  const categories = Array.isArray(payload.categories) ? payload.categories as Category[] : [];
  const categoryCodes = new Set<string>();
  const subcategoryCodes = new Set<string>();
  let total = 0;
  for (const category of categories) {
    const code = typeof category.code === "string" ? category.code : "";
    const target = typeof category.targetSkus === "number" ? category.targetSkus : NaN;
    if (!/^[A-Z0-9_]+$/.test(code) || categoryCodes.has(code)) errors.push(`invalid or duplicate category ${code || "(missing)"}`);
    categoryCodes.add(code);
    const subcategories = Array.isArray(category.subcategories) ? category.subcategories as Subcategory[] : [];
    const subtotal = subcategories.reduce((sum, item) => {
      const subcode = typeof item.code === "string" ? item.code : "";
      const subtarget = typeof item.targetSkus === "number" ? item.targetSkus : NaN;
      if (!/^[A-Z0-9_]+$/.test(subcode) || subcategoryCodes.has(`${code}:${subcode}`)) errors.push(`invalid or duplicate subcategory ${code}:${subcode || "(missing)"}`);
      subcategoryCodes.add(`${code}:${subcode}`);
      if (!Number.isInteger(subtarget) || subtarget < 1) errors.push(`invalid target for ${code}:${subcode}`);
      return sum + (Number.isInteger(subtarget) ? subtarget : 0);
    }, 0);
    if (!Number.isInteger(target) || target !== subtotal) errors.push(`subcategory targets do not reconcile for ${code}`);
    total += Number.isInteger(target) ? target : 0;
  }
  if (total !== 10000) errors.push(`taxonomy target must be 10000, received ${total}`);
  return errors;
}

async function main() {
  const file = resolve(process.cwd(), "data/staging/hospitality-procurement-subtaxonomy.v1.json");
  const payload = JSON.parse(await readFile(file, "utf8")) as { categories?: unknown };
  const errors = validateSubtaxonomy(payload);
  console.log(JSON.stringify({ valid: errors.length === 0, errors }, null, 2));
  if (errors.length) process.exitCode = 2;
}

if (process.argv[1]?.endsWith("validate-subtaxonomy.ts")) void main();
