import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_NEW_USER_PLATFORM_ROLE, getVerifiedPrimaryEmail, isActiveActor } from '@/lib/v2-identity';

export async function getActor() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== userId) return null;

  const email = getVerifiedPrimaryEmail(clerkUser.primaryEmailAddress);
  if (!email) return null;

  const findExisting = () => prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  const existing = await findExisting();
  if (existing) return isActiveActor(existing) ? existing : null;

  // Self-service signups receive least-privilege HOTEL access only. Actor-role
  // elevation must be performed by a trusted server-side approval workflow.
  try {
    return await prisma.$transaction(async (tx) => {
      const racedUser = await tx.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
      if (racedUser) return isActiveActor(racedUser) ? racedUser : null;

      const slug = `hv-${userId.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      const tenant = await tx.tenant.create({
        data: {
          name: clerkUser.firstName ? `${clerkUser.firstName}'s Workspace` : 'HotelsVendors Workspace',
          slug,
          type: 'HOTEL_GROUP',
        },
      });
      const role = await tx.role.create({
        data: { name: `${DEFAULT_NEW_USER_PLATFORM_ROLE}_USER`, tenantId: tenant.id },
      });
      return tx.user.create({
        data: {
          email,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email,
          platformRole: DEFAULT_NEW_USER_PLATFORM_ROLE,
          tenantId: tenant.id,
          roleId: role.id,
          status: 'ACTIVE',
        },
      });
    });
  } catch (error) {
    // Concurrent first requests may race on the unique email/tenant slug.
    // Recover only when a valid active actor now exists for this verified email.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      const racedUser = await findExisting();
      if (racedUser) return isActiveActor(racedUser) ? racedUser : null;
    }
    throw error;
  }
}

export async function requireActor() {
  const user = await getActor();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}
