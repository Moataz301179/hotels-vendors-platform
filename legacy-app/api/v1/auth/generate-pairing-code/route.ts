import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Generate a 3-digit pairing number
    const code = String(Math.floor(100 + Math.random() * 900));

    // Check if this code already exists and is active
    const existingCode = await prisma.pairingCode.findUnique({
      where: { code },
    });

    if (existingCode && !existingCode.usedAt && existingCode.expiresAt > new Date()) {
      // Code exists and is still valid, generate another
      let newCode = code;
      let attempts = 0;
      while (attempts < 10) {
        newCode = String(Math.floor(100 + Math.random() * 900));
        const check = await prisma.pairingCode.findUnique({ where: { code: newCode } });
        if (!check || check.usedAt || check.expiresAt < new Date()) {
          break;
        }
        attempts++;
      }
      if (attempts >= 10) {
        return NextResponse.json({ success: false, error: "Could not generate unique pairing code" }, { status: 500 });
      }
    }

    // Delete any existing unused codes for this user
    await prisma.pairingCode.deleteMany({
      where: {
        userId: session.user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    // Create new pairing code (expires in 5 minutes)
    const pairingCode = await prisma.pairingCode.create({
      data: {
        code,
        userId: session.user.id,
        tenantId: session.user.tenantId || "",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      pairingNumber: code,
      expiresAt: pairingCode.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Generate pairing code error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}