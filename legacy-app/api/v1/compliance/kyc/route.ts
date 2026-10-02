import { NextRequest } from "next/server";
import { z } from "zod";
import { apiRoute, authenticate, validateBody, success, requirePermission } from "@/lib/api-utils";
import { submitKycVerification, getKycStatus } from "@/lib/compliance/kyc";

const KycSubmissionSchema = z.object({
  level: z.literal(1).or(z.literal(2)).or(z.literal(3)),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  commercialRegNumber: z.string().optional(),
  businessLicenseUrl: z.string().url().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankStatementUrl: z.string().url().optional(),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "compliance:kyc:read");

  const status = await getKycStatus(auth.tenantId);
  return success(status);
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "compliance:kyc:submit");

  const body = await request.json();
  const submission = validateBody(KycSubmissionSchema, body);

  const result = await submitKycVerification({
    ...submission,
    tenantId: auth.tenantId,
    userId: auth.userId,
  });

  return success(result, result.success ? 200 : 400);
});
