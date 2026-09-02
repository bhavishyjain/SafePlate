import { Donation } from "../models/Donation.js";
import { Allocation } from "../models/Allocation.js";
import { NGO } from "../models/NGO.js";
import { AppError } from "../middleware/errors.js";

export async function createDonation(req, res, next) {
  try { return res.status(201).json(await Donation.create({ ...req.body, donorId: req.user.id, status: "PENDING", riskScore: 0 })); }
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
    if (req.user.role === "ADMIN") return res.json(await Donation.find().populate("donorId", "name email"));
    if (req.user.role === "DONOR") return res.json(await Donation.find({ donorId: req.user.id }));
    return next(new AppError(403, "Access denied for this role", "FORBIDDEN"));
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
