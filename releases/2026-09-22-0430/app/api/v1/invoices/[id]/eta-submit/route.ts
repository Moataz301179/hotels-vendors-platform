import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateForSubmission } from "@/lib/eta/validator";
import { addEtaSubmissionJob } from "@/lib/eta/queue";
import { apiRoute, authenticate, success, error, audit, requirePermission } from "@/lib/api-utils";

export const POST = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:submit");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;

  const record = await prisma.invoice.findUnique({ where: { id }, select: { tenantId: true } });
  if (!record || record.tenantId !== auth.tenantId) return error("Not found", 404);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { hotel: true, supplier: true, order: { include: { items: { include: { product: true } } } } },
  });

  if (!invoice) return error("Invoice not found", 404);

  const validation = await validateForSubmission(id);
  if (!validation.valid) {
    return error(`ETA submission validation failed: ${validation.message}`, 422);
  }

  // Queue ETA submission for background processing
  const job = await addEtaSubmissionJob({
    invoiceId: id,
    tenantId: auth.tenantId,
    userId: auth.userId,
    platformRole: auth.platformRole,
  });

  await prisma.invoice.update({
    where: { id },
    data: { etaStatus: "PENDING" },
  });

  await audit({
    entityType: "INVOICE",
    entityId: id,
    action: "ETA_QUEUED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { jobId: job.id, status: "QUEUED" },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    message: "Invoice queued for ETA submission",
    jobId: job.id,
    status: "QUEUED",
  });
}, { rateLimit: "api" });
