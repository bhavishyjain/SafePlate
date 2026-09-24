import { Allocation } from "../models/Allocation.js";
import { NGO } from "../models/NGO.js";
import { AppError } from "../middleware/errors.js";
import { paginationFromQuery, paginatedResult } from "../utils/pagination.js";
import { cancelAllocation, confirmAllocationDelivery, confirmAllocationPickup, reassignAllocation, rejectAllocation } from "../services/allocationService.js";

export async function listAllocations(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "NGO") {
      const ngo = await NGO.findOne({ userId: req.user.id });
      if (!ngo) return next(new AppError(404, "NGO profile not found", "NGO_NOT_FOUND"));
      filter.ngoId = ngo._id;
    } else if (req.user.role !== "ADMIN") return next(new AppError(403, "Access denied for this role", "FORBIDDEN"));
    if (req.query.status) filter.status = req.query.status;
    const page = paginationFromQuery(req.query);
    const [items, total] = await Promise.all([
      Allocation.find(filter).select(req.user.role === "ADMIN" ? "" : "-scoreSnapshot -history").populate("donationId").populate("ngoId").sort(page.sort).skip(page.skip).limit(page.limit),
      Allocation.countDocuments(filter),
    ]);
    return res.json(paginatedResult(items, total, page));
  } catch (error) { return next(error); }
}

export async function confirmPickup(req, res, next) {
  try { return res.json({ message: "Pickup confirmed", allocation: await confirmAllocationPickup(req.params.id, req.user) }); }
  catch (error) { return next(error); }
}

export async function confirmDelivery(req, res, next) {
  try { return res.json({ message: "Delivery confirmed", allocation: await confirmAllocationDelivery(req.params.id, req.user) }); }
  catch (error) { return next(error); }
}

export async function reject(req, res, next) {
  try { return res.json({ message: "Assignment rejected and re-optimization attempted", ...(await rejectAllocation(req.params.id, req.user, req.body.reason.trim())) }); }
  catch (error) { return next(error); }
}

export async function cancel(req, res, next) {
  try { return res.json({ message: "Assignment cancelled", allocation: await cancelAllocation(req.params.id, req.user, req.body.reason.trim()) }); }
  catch (error) { return next(error); }
}

export async function reassign(req, res, next) {
  try { return res.json({ message: "Assignment reassigned", allocation: await reassignAllocation(req.params.id, req.user, req.body.ngoId, req.body.reason.trim()) }); }
  catch (error) { return next(error); }
}
