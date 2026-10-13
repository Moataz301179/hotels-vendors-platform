import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { BusinessRegisterSchema } from "@/lib/zod";
import { apiRoute, validateBody, success, error, audit } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/redis";
import { sendEmail, welcomeTemplate, emailVerificationTemplate } from "@/lib/notifications/email";
import { randomBytes, createHash } from "crypto";
import { isNativeTokenRequest } from "@/lib/auth/mobile-session";
import { verifyOtp, normalizePhone } from "@/lib/auth/otp";
import { z } from "zod";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const POST = apiRoute(async (request: NextRequest) => {
  if (!isNativeTokenRequest(request)) return error("Use Clerk to register on the website", 403);
  // Rate limit: 3 registrations per hour per IP
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimit = await checkRateLimit(`register:${clientIp}`, 3600, 3);
  if (!rateLimit.allowed) {
    return error("Too many registration attempts. Please try again later.", 429);
  }

  const body = await request.json();
  const data = validateBody(BusinessRegisterSchema, body);
  if (data.type !== "hotel" && data.type !== "supplier") return error("Partner accounts require reviewed admission", 403);
  const otp = validateBody(z.object({ phone: z.string().min(1), otpCode: z.string().regex(/^\d{6}$/) }), body);
  const verified = await verifyOtp(normalizePhone(otp.phone), otp.otpCode, "REGISTER");
  if (!verified.success) return error(verified.message, 400);

  // Check if email is already registered
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    return error("An account with this email already exists. Please login or use a different email.", 409);
  }

  const passwordHash = await hashPassword(data.password);

  const verifyToken = generateToken();
  const { tenant, user, hotel, supplier, factoringCompany } = await prisma.$transaction(async tx => {
  let hotel;
  let supplier;
  let factoringCompany;

  const platformRole = data.type.toUpperCase() as "HOTEL" | "SUPPLIER" | "FACTORING" | "SHIPPING" | "ADMIN";
  const isIndividual = data.accountType === "individual";
  const accountType = isIndividual ? "INDIVIDUAL" : "BUSINESS";

  // Generate tenant slug — no longer depends on taxId
  const tenantSlug = `${data.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const uniquePlaceholder = `PENDING-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // 1. Create Tenant first — every entity belongs to a tenant
  const tenant = await tx.tenant.create({
    data: {
      name: data.name,
      slug: tenantSlug,
      type: platformRole === "HOTEL" ? "HOTEL_GROUP" :
            platformRole === "SUPPLIER" ? "SUPPLIER" :
            platformRole === "FACTORING" ? "FACTORING_COMPANY" :
            platformRole === "SHIPPING" ? "SHIPPING_PROVIDER" : "PLATFORM",
      taxId: data.taxId || null,
    },
  });

  // 2. Create a default Owner role for this tenant
  const ownerRole = await tx.role.create({
    data: {
      name: "Owner",
      tenantId: tenant.id,
      isGlobal: false,
    },
  });

  const codes = data.type === "hotel"
    ? ["order:read", "order:create", "product:read", "invoice:read", "report:read"]
    : ["order:read", "product:read", "product:create", "product:update", "invoice:read", "report:read"];
  const permissions = await tx.permission.findMany({ where: { code: { in: codes }, deletedAt: null }, select: { id: true } });
  if (permissions.length !== codes.length) throw new Error("Self-service permission catalog is not configured");
  await tx.rolePermission.createMany({ data: permissions.map(permission => ({ roleId: ownerRole.id, permissionId: permission.id })) });

  const userBase = {
    email: data.email,
    name: data.name,
    passwordHash,
    phone: normalizePhone(otp.phone),
    phoneVerifiedAt: new Date(),
    platformRole,
    role: "OWNER" as const,
    tenantId: tenant.id,
    roleId: ownerRole.id,
    accountType: accountType as "INDIVIDUAL" | "BUSINESS",
    marketingConsent: data.marketingConsent ?? false,
    termsAcceptedAt: new Date(),
    privacyPolicyVersion: process.env.PRIVACY_POLICY_VERSION || "1.0",
  };

  if (data.type === "hotel") {
    hotel = await tx.hotel.create({
      data: {
        name: data.name,
        taxId: data.taxId || uniquePlaceholder,
        city: data.city || "Cairo",
        governorate: data.governorate || "Cairo",
        address: data.address,
        commercialReg: data.commercialReg,
        email: data.email,
        tenantId: tenant.id,
      },
    });
    await tx.user.create({
      data: { ...userBase, hotelId: hotel.id },
    });
  } else if (data.type === "supplier") {
    supplier = await tx.supplier.create({
      data: {
        name: data.name,
        taxId: data.taxId || uniquePlaceholder,
        email: data.email,
        city: data.city || "Cairo",
        governorate: data.governorate || "Cairo",
        address: data.address,
        commercialReg: data.commercialReg,
        phone: data.phone,
        tenantId: tenant.id,
        status: "PENDING", // Supplier admission requires review
        tier: "CORE",
      },
    });
    await tx.user.create({
      data: { ...userBase, supplierId: supplier.id },
    });
  } else if (data.type === "factoring") {
    factoringCompany = await tx.factoringCompany.create({
      data: {
        name: data.name,
        taxId: data.taxId || uniquePlaceholder,
        contactEmail: data.email,
        contactPhone: data.phone,
        tenantId: tenant.id,
        status: "ACTIVE",
      },
    });
    await tx.user.create({
      data: { ...userBase, factoringCompanyId: factoringCompany.id },
    });
  } else {
    // Shipping or individual — create user only, no entity yet
    await tx.user.create({
      data: userBase,
    });
  }

  const user = await tx.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("User creation failed");
  }

  // Generate email verification token (hash before storage)
  const verifyTokenHash = hashToken(verifyToken);
  await tx.emailVerificationToken.create({
    data: {
      email: data.email,
      token: verifyTokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  return { tenant, user, hotel, supplier, factoringCompany };
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hotels-vendors.com";

  // Send welcome email
  try {
    const welcome = welcomeTemplate({
      name: data.name,
      loginUrl: `${baseUrl}/login`,
    });
    await sendEmail({
      to: [data.email],
      subject: welcome.subject,
      html: welcome.html,
    });
  } catch {
    // Non-blocking: log but don't fail registration
    console.error("[Register] Failed to send welcome email to", data.email);
  }

  // Send verification email
  try {
    const verification = emailVerificationTemplate({
      name: data.name,
      verificationUrl: `${baseUrl}/verify-email?token=${verifyToken}`,
    });
    await sendEmail({
      to: [data.email],
      subject: verification.subject,
      html: verification.html,
    });
  } catch {
    console.error("[Register] Failed to send verification email to", data.email);
  }

  await audit({
    entityType: "USER",
    entityId: user.id,
    action: "REGISTER",
    tenantId: tenant.id,
    actorId: user.id,
    actorRole: user.platformRole,
    afterState: { platformRole: user.platformRole, type: data.type, accountType: user.accountType, tenantId: tenant.id },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    message: "Registration successful. Please check your email to verify your account before logging in.",
    user: { id: user.id, email: user.email, name: user.name, role: user.role, platformRole: user.platformRole, accountType: user.accountType },
    hotel,
    supplier,
    factoringCompany,
    tenantId: tenant.id,
  }, 201);
});
