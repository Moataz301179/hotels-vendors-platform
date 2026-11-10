import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { InternalDirectoryBatch } from "@/lib/directory/publish-internal-batch";

export const operatingCatalogFiles = [
  "data/directory/hospitality-core-specifications.v1.json",
  "data/directory/hospitality-category-specifications.v1.json",
  "data/directory/hospitality-operating-catalog.v1.json",
];

export function batchesFor(catalog: InternalDirectoryBatch): InternalDirectoryBatch[] {
  if (catalog.records.length <= 20) return [catalog];
  const batches: InternalDirectoryBatch[] = [];
  for (let index = 0; index < catalog.records.length; index += 20) {
    const records = catalog.records.slice(index, index + 20);
    batches.push({
      version: catalog.version,
      source: { ...catalog.source, sourceUrl: `${catalog.source.sourceUrl}/batch-${String(Math.floor(index / 20) + 1).padStart(2, "0")}` },
      records,
    });
  }
  return batches;
}

export async function loadOperatingCatalogBatches() {
  const catalogs = await Promise.all(operatingCatalogFiles.map(async (file) => JSON.parse(await readFile(resolve(process.cwd(), file), "utf8")) as InternalDirectoryBatch));
  return catalogs.flatMap(batchesFor);
}
