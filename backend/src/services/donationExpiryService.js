import { Donation } from "../models/Donation.js";
export const DEFAULT_EXPIRY_REASON = "Pickup deadline expired before assignment";
export async function expirePendingDonations(evaluatedAt = new Date()) {
  const result = await Donation.updateMany({ status: "PENDING", pickupDeadline: { $lte: evaluatedAt } }, { $set: { status: "DISCARDED", discardReason: DEFAULT_EXPIRY_REASON } });
  return { evaluatedAt, expiredCount: result.modifiedCount };
}
