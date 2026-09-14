import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { UserSector } from "@prisma/client";

export const dynamic = "force-dynamic";

// Map free-text segment from the marketing form onto the UserSector enum.
// Anything we cannot classify lands in PROCUREMENT (the platform's core buyer segment).
const SECTOR_MAP: Record<string, UserSector> = {
  hotel: "HOTEL",
  hotels: "HOTEL",
  supplier: "SUPPLIER",
  suppliers: "SUPPLIER",
  factoring: "FACTORING",
  funder: "FACTORING",
  finance: "FINTECH",
  carrier: "LOGISTICS",
  logistics: "LOGISTICS",
  shipping: "LOGISTICS",
};

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email(),
  company: z.string().max(160).optional(),
  segment: z.string().max(40).optional(),
  message: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    const sector = (SECTOR_MAP[(data.segment ?? "hotel").toLowerCase()] ??
      "PROCUREMENT") as UserSector;

    await prisma.leadCapture.create({
      data: {
        companyName: data.company || data.name || "Unknown",
        email: data.email,
        sector,
        role: data.segment,
        message: data.message,
        source: "landing_waitlist",
        status: "new",
      },
    });
    return Response.json({ ok: true });
  } catch (err) {
    // Duplicate email (unique-ish) or validation error — degrade gracefully.
    const msg =
      err instanceof Prisma.PrismaClientKnownRequestError
        ? "already_registered"
        : "invalid";
    return Response.json({ ok: false, error: msg }, { status: 400 });
  }
}
