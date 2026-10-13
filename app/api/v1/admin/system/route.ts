import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute, authenticate, validateQuery } from "@/lib/api-utils";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  await requirePlatformAdmin(ctx, "admin:read");
  validateQuery(z.object({}).strict(), request.nextUrl.searchParams);
  let databaseReachable = false;
  try { await prisma.$queryRaw`SELECT 1`; databaseReachable = true; } catch { /* Do not disclose connection details. */ }
  return NextResponse.json({ success: true, data: {
    checkedAt: new Date().toISOString(), databaseReachable,
    configuration: [
      { service: "Clerk", present: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) },
      { service: "Database", present: Boolean(process.env.DATABASE_URL) },
      { service: "Job queue", present: Boolean(process.env.REDIS_URL) },
      { service: "Email transport", present: Boolean(process.env.SMTP_HOST) },
    ],
    configurationMeaning: "Presence only; not a connectivity or delivery test",
    backupStatus: "not_verified", environmentEditing: "disabled",
  } }, { headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "api" });
