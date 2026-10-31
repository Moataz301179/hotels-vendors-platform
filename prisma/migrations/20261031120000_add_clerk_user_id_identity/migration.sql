-- Add trusted Clerk identity binding to User so a pending signup cannot
-- claim another person's existing pending record by email alone.
-- clerkUserId is the Clerk-issued subject; nullable and unique so legacy
-- rows (pre-Clerk) remain valid until backfilled.
ALTER TABLE "User" ADD COLUMN "clerkUserId" TEXT;
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
