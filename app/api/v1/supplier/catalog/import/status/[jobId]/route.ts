/**
 * GET /api/v1/supplier/catalog/import/status/[jobId]
 * Poll for enrichment job completion and get preview
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { getImportJob } from "@/lib/ai/catalog-importer";

export const GET = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "product:create");

  const { jobId } = await params;

  if (!jobId) {
    return error("Job ID required", 400);
  }

  const job = getImportJob(jobId);

  if (!job) {
    return error("Job not found or expired", 404);
  }

  // Verify tenant access
  if (job.tenantId !== auth.tenantId && auth.platformRole !== "ADMIN") {
    return error("Access denied", 403);
  }

  // Return current status
  const response: Record<string, unknown> = {
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    currentStep: job.currentStep,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };

  if (job.error) {
    response.error = job.error;
  }

  if (job.preview) {
    response.preview = job.preview;
  }

  return success(response);
}, { rateLimit: "api" });