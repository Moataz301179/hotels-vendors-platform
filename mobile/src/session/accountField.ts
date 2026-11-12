/** Switching accounts must not keep the previous organization's field drafts or outbox. */
export function fieldStateAction(previousAccountId: string | null, nextAccountId: string | null) {
  if (!nextAccountId) return "keep" as const;
  if (previousAccountId && previousAccountId !== nextAccountId) return "clear" as const;
  return "keep" as const;
}
