import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pairingNumber = String(body?.pairingNumber ?? "").trim();

    if (!pairingNumber) {
      return NextResponse.json({ success: false, error: "Pairing number is required" }, { status: 400 });
    }

    // Find the pairing code in the database
    const pairingCode = await prisma.pairingCode.findUnique({
      where: { code: pairingNumber },
      include: { user: true },
    });

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Invalid pairing number" }, { status: 401 });
    }

    // Check if code is expired (5 minutes)
    if (pairingCode.expiresAt < new Date()) {
      await prisma.pairingCode.delete({ where: { id: pairingCode.id } });
      return NextResponse.json({ success: false, error: "Pairing number has expired" }, { status: 401 });
    }

    // Check if already used
    if (pairingCode.usedAt) {
      return NextResponse.json({ success: false, error: "Pairing number already used" }, { status: 401 });
    }

    // Get the current session (if any) to link
    const session = await getServerSession();
    let targetUserId = pairingCode.userId;

    if (session?.user?.id) {
      // User is already logged in on web - link their web account to the INVO user
      // This would be for funders who registered on web first
      targetUserId = session.user.id;
    }

    // Mark pairing code as used
    await prisma.pairingCode.update({
      where: { id: pairingCode.id },
      data: { usedAt: new Date(), linkedUserId: targetUserId },
    });

    // TODO: Set session/cookie for the linked user
    // This depends on your auth implementation

    return NextResponse.json({
      success: true,
      message: "Accounts paired successfully",
      user: {
        id: pairingCode.user.id,
        name: pairingCode.user.name,
        role: pairingCode.user.role,
        tenantId: pairingCode.user.tenantId,
      },
    });
  } catch (error) {
    console.error("Pairing error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}