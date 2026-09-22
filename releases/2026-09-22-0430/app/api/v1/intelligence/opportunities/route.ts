import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

import { matchOpportunity } from "@/lib/intelligence/opportunity/engine";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requirePermission(auth, "intelligence:read");
  return success({ opportunities: [] }); // Real engine requires NeedFinding input; empty when none provided (honest empty state)
});
