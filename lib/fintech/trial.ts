const TRIAL_DAYS = 7;

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  endsAt: Date;
  isExpired: boolean;
}

export function getTrialStatus(createdAt: Date | string): TrialStatus {
  const start = new Date(createdAt);
  const now = new Date();
  const endsAt = new Date(start.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const diffMs = endsAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isActive = now < endsAt;
  const isExpired = now >= endsAt;

  return { isActive, daysRemaining, endsAt, isExpired };
}

export function formatTrialEnds(endsAt: Date): string {
  return endsAt.toLocaleDateString("en-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
