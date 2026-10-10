import { createHash } from "node:crypto";
import register from "../data/staging/egypt-hospitality-supplier-register.v1.json";
import { PrismaClient } from "@prisma/client";

type Candidate = {
  name: string;
  type: string;
  categories: string[];
  website: string;
  source: string;
  sourceObservedAt: string;
  status: "RESEARCH_CANDIDATE";
};

const candidates = register.records as Candidate[];
const apply = process.argv.includes("--apply");

function sourceHash(candidate: Candidate) {
  return createHash("sha256")
    .update([candidate.name, candidate.type, candidate.source].join("\u0000"))
    .digest("hex");
}

function validate() {
  if (register.status !== "RESEARCH_CANDIDATE_ONLY") throw new Error("Only research candidates may be imported.");
  if (!candidates.length) throw new Error("The research register is empty.");
  for (const candidate of candidates) {
    if (!candidate.name || !candidate.type || !candidate.source || !candidate.website || !candidate.categories.length) {
      throw new Error(`Incomplete research candidate: ${candidate.name || "unknown"}`);
    }
    if (candidate.status !== "RESEARCH_CANDIDATE") throw new Error(`Unexpected status for ${candidate.name}`);
    if (Number.isNaN(new Date(candidate.sourceObservedAt).valueOf())) throw new Error(`Invalid source date for ${candidate.name}`);
  }
}

async function main() {
  validate();
  if (!apply) {
    console.log(`Validated ${candidates.length} supplier research candidates. Run with --apply and HV_ALLOW_STAGING_RESEARCH_IMPORT=1 to write staging data.`);
    return;
  }
  if (process.env.HV_ALLOW_STAGING_RESEARCH_IMPORT !== "1") {
    throw new Error("Refusing to write. Set HV_ALLOW_STAGING_RESEARCH_IMPORT=1 for a reviewed staging import.");
  }

  const prisma = new PrismaClient();
  try {
    for (const candidate of candidates) {
      await prisma.supplierResearchCandidate.upsert({
        where: { sourceHash: sourceHash(candidate) },
        update: {
          name: candidate.name,
          candidateType: candidate.type,
          website: candidate.website,
          sourceUrl: candidate.source,
          sourceObservedAt: new Date(candidate.sourceObservedAt),
          categories: candidate.categories,
          status: "RESEARCH_CANDIDATE",
        },
        create: {
          name: candidate.name,
          candidateType: candidate.type,
          website: candidate.website,
          sourceUrl: candidate.source,
          sourceObservedAt: new Date(candidate.sourceObservedAt),
          categories: candidate.categories,
          status: "RESEARCH_CANDIDATE",
          sourceHash: sourceHash(candidate),
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log(`Imported ${candidates.length} supplier research candidates.`);
}

void main();
