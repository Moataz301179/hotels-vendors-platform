import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, PermissionDeniedError } from "@/lib/api-utils";

/** Preserve known validation/auth failures without returning raw database or provider errors. */
export function apiErrorResponse(cause: unknown) {
  if (cause instanceof ApiError) return NextResponse.json({ success: false, error: cause.message }, { status: cause.statusCode });
  if (cause instanceof PermissionDeniedError) return NextResponse.json({ success: false, error: cause.message }, { status: 403 });
  if (cause instanceof z.ZodError) return NextResponse.json({ success: false, error: "Invalid request", issues: cause.issues.map(issue => ({ path: issue.path, message: issue.message })) }, { status: 400 });
  return NextResponse.json({ success: false, error: "The request could not be completed" }, { status: 500 });
}
