export const DONATION_STATUSES = Object.freeze([
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "DELIVERED",
  "DISCARDED",
]);

const ALLOWED_TRANSITIONS = Object.freeze({
  PENDING: new Set(["ASSIGNED", "DISCARDED"]),
  ASSIGNED: new Set(["PICKED_UP", "DISCARDED"]),
  PICKED_UP: new Set(["DELIVERED"]),
  DELIVERED: new Set(),
  DISCARDED: new Set(),
});

export function canTransitionDonation(fromStatus, toStatus) {
  return ALLOWED_TRANSITIONS[fromStatus]?.has(toStatus) ?? false;
}
