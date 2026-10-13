import { NextRequest } from "next/server";
import { z } from "zod";
import { apiRoute, success, error, validateBody } from "@/lib/api-utils";
import { isNativeTokenRequest, rotateMobileSession } from "@/lib/auth/mobile-session";

const RefreshSchema = z.object({ refreshToken: z.string().regex(/^[a-f0-9]{80}$/) }).strict();

export const POST = apiRoute(async (request: NextRequest) => {
  if (!isNativeTokenRequest(request)) return error("Use Clerk to refresh browser sessions", 403);
  const data = validateBody(RefreshSchema, await request.json());
  const session = await rotateMobileSession(data.refreshToken);
  if (!session) return error("Invalid or expired refresh token", 401);
  return success(session);
}, { rateLimit: "auth" });
