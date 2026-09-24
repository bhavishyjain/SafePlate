import { Donation } from "../models/Donation.js";
import { Allocation } from "../models/Allocation.js";
import { NGO } from "../models/NGO.js";
import { AppError } from "../middleware/errors.js";
import { paginationFromQuery, paginatedResult } from "../utils/pagination.js";

export async function createDonation(req, res, next) {
  try { return res.status(201).json(await Donation.create({ ...req.body, donorId: req.user.id, status: "PENDING" })); }
  catch (error) { return next(error); }
}

export async function updateDonation(req, res, next) {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return next(new AppError(404, "Donation not found", "DONATION_NOT_FOUND"));
    if (req.user.role === "DONOR" && donation.donorId.toString() !== req.user.id) return next(new AppError(403, "You cannot edit this donation", "FORBIDDEN"));
    if (donation.status !== "PENDING") return next(new AppError(409, "Only pending donations can be edited", "DONATION_NOT_EDITABLE"));
    const preparedAt = new Date(req.body.preparedAt ?? donation.preparedAt);
    const deadline = new Date(req.body.pickupDeadline ?? donation.pickupDeadline);
    if (preparedAt >= deadline) return next(new AppError(400, "Pickup deadline must be after prepared time", "INVALID_DONATION_DATES"));
    Object.assign(donation, req.body);
    await donation.save();
    return res.json(donation);
  } catch (error) { return next(error); }
}

export async function discardDonation(req, res, next) {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return next(new AppError(404, "Donation not found", "DONATION_NOT_FOUND"));
    if (req.user.role === "DONOR" && donation.donorId.toString() !== req.user.id) return next(new AppError(403, "You cannot update this donation", "FORBIDDEN"));
    if (donation.status !== "PENDING") return next(new AppError(409, "Only pending donations can be discarded here", "INVALID_STATUS_TRANSITION"));
    donation.status = "DISCARDED";
    donation.discardReason = req.body.reason?.trim() || "Cancelled by donor or administrator";
    await donation.save();
    return res.json(donation);
  } catch (error) { return next(error); }
}

export async function listDonations(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "DONOR") filter.donorId = req.user.id;
    else if (req.user.role !== "ADMIN") return next(new AppError(403, "Access denied for this role", "FORBIDDEN"));
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) {
        const from = new Date(req.query.from);
        if (Number.isNaN(from.getTime())) return next(new AppError(400, "from must be a valid date", "INVALID_DATE_RANGE"));
        filter.createdAt.$gte = from;
      }
      if (req.query.to) {
        const to = new Date(req.query.to);
        if (Number.isNaN(to.getTime())) return next(new AppError(400, "to must be a valid date", "INVALID_DATE_RANGE"));
        filter.createdAt.$lte = to;
      }
      if (filter.createdAt.$gte && filter.createdAt.$lte && filter.createdAt.$gte > filter.createdAt.$lte) {
        return next(new AppError(400, "from cannot be after to", "INVALID_DATE_RANGE"));
      }
    }
    const page = paginationFromQuery(req.query);
    const [items, total] = await Promise.all([
      Donation.find(filter).populate("donorId", "name email").sort(page.sort).skip(page.skip).limit(page.limit),
      Donation.countDocuments(filter),
    ]);
    return res.json(paginatedResult(items, total, page));
  } catch (error) { return next(error); }
}

export async function getDonation(req, res, next) {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return next(new AppError(404, "Donation not found", "DONATION_NOT_FOUND"));
    const isOwner = req.user.role === "DONOR" && donation.donorId.toString() === req.user.id;
    let isAssignedNgo = false;
    if (req.user.role === "NGO") {
      const ngo = await NGO.findOne({ userId: req.user.id }).select("_id");
      if (ngo) isAssignedNgo = Boolean(await Allocation.exists({ donationId: donation._id, ngoId: ngo._id }));
    }
    if (req.user.role !== "ADMIN" && !isOwner && !isAssignedNgo) return next(new AppError(403, "You cannot access this donation", "FORBIDDEN"));
    if (req.user.role === "ADMIN" || isAssignedNgo) await donation.populate("donorId", "name phone email");
    return res.json(donation);
  } catch (error) { return next(error); }
}
