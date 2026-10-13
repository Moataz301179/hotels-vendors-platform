import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, validateBody, error, ApiError } from "@/lib/api-utils";
const SettlementInput = z.object({ invoiceId: z.string().min(1).max(128), supplierId: z.string().min(1).max(128), amount: z.number().finite().positive(), method: z.enum(["bank_transfer"]).default("bank_transfer") });
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requirePermission(auth, "factoring:fund");
  const input = validateBody(SettlementInput, await request.json());
  const invoice = await prisma.invoice.findFirst({ where: { id: input.invoiceId, supplierId: input.supplierId, tenantId: auth.tenantId, deletedAt: null }, select: { id: true } });
  if (!invoice) throw new ApiError("Invoice not found", 404);
  return error("Settlement requires a verified transfer provider and ledger reconciliation. No transfer was executed.", 503);
});
