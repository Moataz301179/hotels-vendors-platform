/** Trusted identity helpers for V2 actor provisioning. */
export type ClerkPrimaryEmail = {
  emailAddress: string;
  verification?: { status?: string | null } | null;
} | null | undefined;

/** Only link/provision an application account from Clerk's verified primary email. */
export function getVerifiedPrimaryEmail(primary: ClerkPrimaryEmail): string | null {
  if (!primary || primary.verification?.status !== 'verified') return null;
  const email = primary.emailAddress.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

/** New self-service accounts always start with least-privilege HOTEL access.
 * Actor elevation must be performed by a trusted, server-side onboarding/admin flow.
 * Never derive authorization roles from Clerk unsafeMetadata or client input.
 */
export const DEFAULT_NEW_USER_PLATFORM_ROLE = 'HOTEL' as const;
