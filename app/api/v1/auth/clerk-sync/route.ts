import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const ROLE_MAP = { HOTEL: "HOTEL", SUPPLIER: "SUPPLIER", FACTORING: "FACTORING", SHIPPING: "SHIPPING" } as const;
const ROLE_NAMES = { HOTEL: "Hotel Manager", SUPPLIER: "Supplier Manager", FACTORING: "Factoring Agent", SHIPPING: "Logistics Coordinator" } as const;
const TENANT_TYPES = { HOTEL: "HOTEL_GROUP", SUPPLIER: "SUPPLIER", FACTORING: "FACTORING", SHIPPING: "LOGISTICS" } as const;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json({ ok: false, error: "Verified email required" }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, tenantId: true, platformRole: true } });
  if (existing) return NextResponse.json({ ok: true, ...existing });
  const requested = String((clerkUser?.unsafeMetadata as any)?.platformRole || "HOTEL").toUpperCase() as keyof typeof ROLE_MAP;
  const platformRole = ROLE_MAP[requested] || "HOTEL";
  const roleName = ROLE_NAMES[requested] || ROLE_NAMES.HOTEL;
  const type = TENANT_TYPES[requested] || "HOTEL_GROUP";
  const base = (clerkUser?.firstName || "workspace").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
  const slug = `${base}-${clerkUser!.id.slice(-8).toLowerCase()}`;
  const role = await prisma.role.findFirst({ where: { name: roleName }, select: { id: true } }) || await prisma.role.findFirst({ where: { isGlobal: true, name: "Platform Admin" }, select: { id: true } });
  if (!role) return NextResponse.json({ ok: false, error: "Role configuration is missing" }, { status: 500 });
  const tenant = await prisma.tenant.create({ data: { name: clerkUser?.firstName ? `${clerkUser.firstName}'s Workspace` : "HotelsVendors Workspace", slug, type: type as any } });
  const user = await prisma.user.create({ data: { email, name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || email, tenantId: tenant.id, roleId: role.id, platformRole, status: "ACTIVE", accountType: "BUSINESS", emailVerifiedAt: new Date() } });
  return NextResponse.json({ ok: true, userId: user.id, tenantId: tenant.id, platformRole: user.platformRole });
}
