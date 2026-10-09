import { Allocation } from "../models/Allocation.js";
import { Donation } from "../models/Donation.js";
import { AppError } from "../middleware/errors.js";

function dateRange(query) {
  const range = {};
  if (query.from) {
    const from = new Date(query.from);
    if (Number.isNaN(from.getTime())) throw new AppError(400, "from must be a valid date", "INVALID_DATE_RANGE");
    range.$gte = from;
  }
  if (query.to) {
    const to = new Date(query.to);
    if (Number.isNaN(to.getTime())) throw new AppError(400, "to must be a valid date", "INVALID_DATE_RANGE");
    range.$lte = to;
  }
  if (range.$gte && range.$lte && range.$gte > range.$lte) throw new AppError(400, "from cannot be after to", "INVALID_DATE_RANGE");
  return Object.keys(range).length ? { createdAt: range } : {};
}

export async function summary(req, res, next) {
  try {
    const donationMatch = dateRange(req.query);
    const allocationMatch = Object.keys(donationMatch).length ? { assignedAt: donationMatch.createdAt } : {};
    const [donationTotals, allocationTotals, servedNgoIds, dailyTrend] = await Promise.all([
      Donation.aggregate([{ $match: donationMatch }, { $group: { _id: null, kgDonated: { $sum: "$quantityKg" }, kgDelivered: { $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, "$quantityKg", 0] } }, kgDiscarded: { $sum: { $cond: [{ $eq: ["$status", "DISCARDED"] }, "$quantityKg", 0] } }, unmatchedDonations: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } } } }]),
      Allocation.aggregate([{ $match: allocationMatch }, { $lookup: { from: "donations", localField: "donationId", foreignField: "_id", as: "donation" } }, { $unwind: "$donation" }, { $group: { _id: null, total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0] } }, kgAssigned: { $sum: "$donation.quantityKg" } } }]),
      Allocation.distinct("ngoId", { ...allocationMatch, status: "DELIVERED" }),
      Donation.aggregate([{ $match: donationMatch }, { $group: { _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d", timezone: "Asia/Kolkata" } }, donatedKg: { $sum: "$quantityKg" }, deliveredKg: { $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, "$quantityKg", 0] } } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, date: "$_id", donatedKg: 1, deliveredKg: 1 } }]),
    ]);
    const donations = donationTotals[0] ?? { kgDonated: 0, kgDelivered: 0, kgDiscarded: 0, unmatchedDonations: 0 };
    const allocations = allocationTotals[0] ?? { total: 0, delivered: 0, kgAssigned: 0 };
    return res.json({ ...donations, kgAssigned: allocations.kgAssigned, ngosServed: servedNgoIds.length, deliverySuccessRate: allocations.total ? allocations.delivered / allocations.total : 0, dailyTrend });
  } catch (error) { return next(error); }
}
