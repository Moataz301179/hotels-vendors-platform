import { NextRequest } from "next/server";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { findActiveAccount } from "@/lib/auth/account-identity";
import { getUserPermissions } from "@/lib/auth/rbac";

export const GET = apiRoute(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  const user = await findActiveAccount({ id: ctx.userId });
  if (!user || user.tenantId !== ctx.tenantId) throw new Error("Account is no longer active");
  const permissions = await getUserPermissions(ctx);
  return success({ ...user, permissions });
});
