/** HV records operational facts; independent institutions own all credit decisions. */
export function rejectNativeFunding(): never {
  throw new Error('EXTERNAL_FUNDER_REQUIRED: HV cannot score credit, extend limits or execute payouts.');
}

export function requireLiveFunderConfiguration(configured: boolean, mock: boolean): void {
  if (!configured || mock) throw new Error('FUNDER_UNAVAILABLE: A verified live funder connection is required.');
}
