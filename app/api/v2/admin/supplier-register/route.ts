import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { operatingCategories, operatingCategory } from "@/lib/directory/operating-category";
import { publicMarketplaceDirectoryProfileWhere } from "@/lib/directory/public-marketplace";

type ResearchRecord = {
  name: string;
  type: string;
  categories: string[];
  website: string;
  source: string;
  sourceObservedAt: string;
  status: "RESEARCH_CANDIDATE";
};

async function adminActor() {
  const actor = await getActor();
  if (!actor) return { actor: null, response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) };
  if (actor.platformRole !== "ADMIN") return { actor: null, response: NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 }) };
  return { actor, response: null };
}

function sourceHash(candidate: ResearchRecord) {
  return createHash("sha256").update([candidate.name, candidate.type, candidate.source].join("\u0000")).digest("hex");
}

async function readStagingRegister() {
  const file = JSON.parse(await readFile(resolve(process.cwd(), "data/staging/egypt-hospitality-supplier-register.v1.json"), "utf8")) as { status?: string; records?: ResearchRecord[] };
  if (file.status !== "RESEARCH_CANDIDATE_ONLY") throw new Error("RESEARCH_REGISTER_REQUIRED");
  const records = file.records ?? [];
  if (!records.length) throw new Error("RESEARCH_REGISTER_EMPTY");
  for (const record of records) {
    if (record.status !== "RESEARCH_CANDIDATE" || !record.name || !record.type || !record.website || !record.source || !record.categories?.length) {
      throw new Error(`INCOMPLETE_RESEARCH_CANDIDATE:${record.name || "unknown"}`);
    }
  }
  return records;
}

async function coverage() {
  const profiles = await prisma.directoryProfile.findMany({
    where: publicMarketplaceDirectoryProfileWhere,
    select: { category: true, name: true },
  });
  const counts = new Map<string, number>();
  for (const profile of profiles) {
    const area = operatingCategory(profile.category, profile.name);
    counts.set(area.group, (counts.get(area.group) ?? 0) + 1);
  }
  return [...counts.entries()].map(([group, listings]) => ({ group, listings })).sort((a, b) => a.group.localeCompare(b.group));
}

export async function GET() {
  const { actor, response } = await adminActor();
  if (!actor) return response;
  const candidates = await prisma.supplierResearchCandidate.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    take: 200,
  });
  return NextResponse.json({
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      candidateType: candidate.candidateType,
      website: candidate.website,
      sourceUrl: candidate.sourceUrl,
      sourceObservedAt: candidate.sourceObservedAt,
      status: candidate.status,
      categories: candidate.categories,
      operatingAreas: operatingCategories(candidate.categories),
    })),
    coverage: await coverage(),
    boundary: "Admin contracting targets only. Research records are not verified suppliers and are not shown to hotels.",
  });
}

export async function POST() {
  const { actor, response } = await adminActor();
  if (!actor) return response;
  const records = await readStagingRegister();
  const imported = await prisma.$transaction(async (tx) => {
    for (const record of records) {
      await tx.supplierResearchCandidate.upsert({
        where: { sourceHash: sourceHash(record) },
        update: {
          name: record.name,
          candidateType: record.type,
          website: record.website,
          sourceUrl: record.source,
          sourceObservedAt: new Date(record.sourceObservedAt),
          categories: record.categories,
          status: "RESEARCH_CANDIDATE",
          deletedAt: null,
        },
        create: {
          name: record.name,
          candidateType: record.type,
          website: record.website,
          sourceUrl: record.source,
          sourceObservedAt: new Date(record.sourceObservedAt),
          categories: record.categories,
          status: "RESEARCH_CANDIDATE",
          sourceHash: sourceHash(record),
        },
      });
    }
    await appendAuditEntry({
      entityName: "SUPPLIER_RESEARCH_REGISTER",
      entityId: actor.tenantId,
      actionType: "STATUS_CHANGED",
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { action: "STAGING_RESEARCH_REGISTER_IMPORTED", records: records.length, publicDisclosure: false },
    }, tx);
    return records.length;
  });
  return NextResponse.json({ imported, status: "RESEARCH_CANDIDATE" });
}
