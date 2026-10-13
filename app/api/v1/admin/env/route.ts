import { NextRequest } from "next/server";
import { apiRoute, error, validateBody } from "@/lib/api-utils";
import { requireSensitiveAdmin } from "@/lib/admin/access";
import { z } from "zod";

export const POST = apiRoute(async (request: NextRequest) => {
  await requireSensitiveAdmin(request, "admin:manage_env");
  validateBody(z.object({ key: z.literal("NEXT_PUBLIC_FINTECH_SANDBOX"), value: z.enum(["true", "false"]) }).strict(), await request.json());
  return error("Environment changes require the controlled deployment process. No configuration was changed.", 501);
}, { rateLimit: "financial" });
