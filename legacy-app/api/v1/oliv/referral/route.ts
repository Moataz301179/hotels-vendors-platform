import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const OlivReferralSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(["SUPPLIER", "HOTEL"], { error: () => ({ message: "Role must be SUPPLIER or HOTEL" }) }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = OlivReferralSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid request body" },
        { status: 400 }
      );
    }
    const { name, email, phone, company, role } = parsed.data;

    const lead = await prisma.leadCapture.create({
      data: {
        companyName: company || `${name} (Oliv Referral)`,
        email,
        sector: "HOTEL",
        role,
        message: JSON.stringify({
          referralCode: "CHV000",
          phone: phone || null,
          capturedAt: new Date().toISOString(),
        }),
        source: "OLIV_REFERRAL_PAGE",
        status: "new",
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: lead.id, message: "Referral lead captured successfully" },
    });
  } catch (error) {
    console.error("Referral lead error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const leads = await prisma.leadCapture.findMany({
      where: { source: "OLIV_REFERRAL_PAGE" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error("Fetch referral leads error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
