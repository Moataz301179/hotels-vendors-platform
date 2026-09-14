-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "type" TEXT NOT NULL,
    "marketFocus" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "pricing" TEXT,
    "feeStructure" TEXT,
    "merchantCount" INTEGER,
    "supplierCount" INTEGER,
    "geoCoverage" TEXT,
    "features" TEXT,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "funding" TEXT,
    "totalRaised" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "publishedAt" DATETIME,
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "impactScore" INTEGER NOT NULL DEFAULT 50,
    "competitorId" TEXT,
    "discoveredBy" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketInsight_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetActor" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "complexity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "impact" TEXT NOT NULL DEFAULT 'MEDIUM',
    "effortWeeks" REAL,
    "gapAddressed" TEXT,
    "moatScore" INTEGER NOT NULL DEFAULT 50,
    "revenuePotential" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "proposedBy" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "relatedCompetitorIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskType" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "output" TEXT,
    "findings" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "durationMs" INTEGER,
    "parentRunId" TEXT,
    "childRunIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_name_key" ON "Competitor"("name");
