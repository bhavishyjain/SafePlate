import { Allocation } from "../models/Allocation.js";
import { Donation } from "../models/Donation.js";
import { AppError } from "../middleware/errors.js";
import { parseOperationalDateBoundary } from "../utils/date.js";

function dateRange(query) {
  const range = {};
  if (query.from) {
    const from = parseOperationalDateBoundary(query.from);
    if (Number.isNaN(from.getTime())) throw new AppError(400, "from must be a valid date", "INVALID_DATE_RANGE");
    range.$gte = from;
  }
  if (query.to) {
    const to = parseOperationalDateBoundary(query.to, true);
    if (Number.isNaN(to.getTime())) throw new AppError(400, "to must be a valid date", "INVALID_DATE_RANGE");
    range.$lte = to;
  }
  if (range.$gte && range.$lte && range.$gte > range.$lte) throw new AppError(400, "from cannot be after to", "INVALID_DATE_RANGE");
  return range;
}

const dayExpression = (field) => ({ $dateToString: { date: field, format: "%Y-%m-%d", timezone: "Asia/Kolkata" } });
const matchOn = (field, range) => Object.keys(range).length ? { [field]: range } : {};
const joinDonation = [{ $lookup: { from: "donations", localField: "donationId", foreignField: "_id", as: "donation" } }, { $unwind: "$donation" }];

export async function summary(req, res, next) {
  try {
    const range = dateRange(req.query);
    const [donations, assignments, deliveries, donatedTrend, deliveredTrend, servedNgoIds] = await Promise.all([
      Donation.aggregate([{ $match: matchOn("createdAt", range) }, { $group: { _id: null, kgDonated: { $sum: "$quantityKg" }, kgDiscarded: { $sum: { $cond: [{ $eq: ["$status", "DISCARDED"] }, "$quantityKg", 0] } }, unmatchedDonations: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } } } }]),
      Allocation.aggregate([{ $match: matchOn("assignedAt", range) }, ...joinDonation, { $group: { _id: null, total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0] } }, kgAssigned: { $sum: "$donation.quantityKg" } } }]),
      Allocation.aggregate([{ $match: { status: "DELIVERED", ...matchOn("deliveredConfirmedAt", range) } }, ...joinDonation, { $group: { _id: null, total: { $sum: 1 }, kgDelivered: { $sum: "$donation.quantityKg" } } }]),
      Donation.aggregate([{ $match: matchOn("createdAt", range) }, { $group: { _id: dayExpression("$createdAt"), donatedKg: { $sum: "$quantityKg" } } }, { $sort: { _id: 1 } }]),
      Allocation.aggregate([{ $match: { status: "DELIVERED", ...matchOn("deliveredConfirmedAt", range) } }, ...joinDonation, { $group: { _id: dayExpression("$deliveredConfirmedAt"), deliveredKg: { $sum: "$donation.quantityKg" } } }, { $sort: { _id: 1 } }]),
      Allocation.distinct("ngoId", { status: "DELIVERED", ...matchOn("deliveredConfirmedAt", range) }),
    ]);
    const trendByDay = new Map();
    for (const item of donatedTrend) trendByDay.set(item._id, { date: item._id, donatedKg: item.donatedKg, deliveredKg: 0 });
    for (const item of deliveredTrend) {
      const day = trendByDay.get(item._id) ?? { date: item._id, donatedKg: 0, deliveredKg: 0 };
      day.deliveredKg = item.deliveredKg;
      trendByDay.set(item._id, day);
    }
    const donationTotal = donations[0] ?? { kgDonated: 0, kgDiscarded: 0, unmatchedDonations: 0 };
    const assignmentTotal = assignments[0] ?? { total: 0, delivered: 0, kgAssigned: 0 };
    const deliveryTotal = deliveries[0] ?? { total: 0, kgDelivered: 0 };
    return res.json({ ...donationTotal, kgAssigned: assignmentTotal.kgAssigned, kgDelivered: deliveryTotal.kgDelivered, ngosServed: servedNgoIds.length, deliverySuccessRate: assignmentTotal.total ? assignmentTotal.delivered / assignmentTotal.total : 0, dailyTrend: [...trendByDay.values()].sort((a, b) => a.date.localeCompare(b.date)) });
  } catch (error) { return next(error); }
}
