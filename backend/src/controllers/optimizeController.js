import { Donation } from "../models/Donation.js";
import { NGO } from "../models/NGO.js";
import { Allocation } from "../models/Allocation.js";
import { runHeuristicAllocation } from "../engines/AllocationEngine.js";
import { expirePendingDonations } from "../services/donationExpiryService.js";

export async function optimize(req, res, next) {
  try {
    const evaluatedAt = new Date();
    const expired = await expirePendingDonations(evaluatedAt);
    const donations = await Donation.find({ status: "PENDING", pickupDeadline: { $gt: evaluatedAt } });
    const proposals = runHeuristicAllocation(donations, await NGO.find());
    const allocations = [];
    for (const proposal of proposals) {
      const allocation = await Allocation.create(proposal);
      await Donation.findByIdAndUpdate(proposal.donationId, { status: "ASSIGNED" });
      allocations.push(allocation);
    }
    return res.json({ message: "Allocation engine executed successfully", evaluatedAt, expiredDonationsDiscarded: expired.expiredCount, allocationsCreatedCount: allocations.length, allocations });
  } catch (error) { return next(error); }
}
