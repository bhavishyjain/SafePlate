import { NGO } from "../models/NGO.js";
import { User } from "../models/User.js";
import { NgoNutritionLog } from "../models/NgoNutritionLog.js";
import { AppError } from "../middleware/errors.js";
import { startOfOperationalDay } from "../utils/date.js";
import { calculateNgoNutrition, effectiveNgoNutrition } from "../services/ngoNutritionService.js";
import { Donation } from "../models/Donation.js";
import { Allocation } from "../models/Allocation.js";
import { paginationFromQuery, paginatedResult } from "../utils/pagination.js";
import { haversineDistanceKm } from "../engines/AllocationEngine.js";
import { getConfig } from "../config/env.js";

function canAccess(req, ngo) { return req.user.role === "ADMIN" || (ngo.userId?._id || ngo.userId).toString() === req.user.id; }

export async function listNgos(req, res, next) {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.search?.trim()) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const users = await User.find({ role: "NGO", $or: [{ name: new RegExp(escaped, "i") }, { email: new RegExp(escaped, "i") }, { organization: new RegExp(escaped, "i") }] }).select("_id");
      filter.userId = { $in: users.map((user) => user._id) };
    }
    const page = paginationFromQuery(req.query);
    const [items, total] = await Promise.all([
      NGO.find(filter).populate("userId", "name phone email organization isActive").sort(page.sort).skip(page.skip).limit(page.limit),
      NGO.countDocuments(filter),
    ]);
    return res.json(paginatedResult(items, total, page));
  } catch (error) { return next(error); }
}

export async function eligibleNgos(req, res, next) {
  try {
    const donation = await Donation.findById(req.params.donationId).lean();
    if (!donation) return next(new AppError(404, "Donation not found", "DONATION_NOT_FOUND"));
    const [ngos, allocation] = await Promise.all([
      NGO.find().populate("userId", "name phone email organization isActive").lean(),
      Allocation.findOne({ donationId: donation._id }).select("rejectedNgoIds").lean(),
    ]);
    const rejected = new Set((allocation?.rejectedNgoIds ?? []).map(String));
    const maximum = getConfig().maximumPickupRadiusKm;
    const items = ngos.map((ngo) => ({ ...ngo, distanceKm: haversineDistanceKm(donation.location, ngo.location) }))
      .filter((ngo) => !rejected.has(String(ngo._id)) && ngo.distanceKm <= maximum && ngo.userId?.isActive !== false)
      .sort((left, right) => left.distanceKm - right.distanceKm);
    return res.json({ items, maximumPickupRadiusKm: maximum });
  } catch (error) { return next(error); }
}

export async function upsertNgo(req, res, next) {
  try {
    const targetUserId = req.user.role === "ADMIN" ? req.body.userId : req.user.id;
    const user = await User.findById(targetUserId).select("role");
    if (!user || user.role !== "NGO") return next(new AppError(400, "Profile owner must be an NGO user", "INVALID_NGO_USER"));
    const calculated = calculateNgoNutrition(req.body.beneficiaryGroups);
    const profile = await NGO.findOneAndUpdate(
      { userId: targetUserId },
      { $set: { type: req.body.type, location: req.body.location, beneficiaryGroups: req.body.beneficiaryGroups, capacity: calculated.capacity, calculatedNutrition: { caloriesPerDay: calculated.caloriesPerDay, proteinGramsPerDay: calculated.proteinGramsPerDay, referenceVersion: calculated.referenceVersion } } },
      { upsert: true, new: true, runValidators: true }
    );
    return res.status(201).json(profile);
  } catch (error) { return next(error); }
}

export async function getNgo(req, res, next) {
  try {
    const ngo = await NGO.findById(req.params.id).populate("userId", "name phone email");
    if (!ngo) return next(new AppError(404, "NGO profile not found", "NGO_NOT_FOUND"));
    if (!canAccess(req, ngo)) return next(new AppError(403, "You cannot access this NGO profile", "FORBIDDEN"));
    return res.json(ngo);
  } catch (error) { return next(error); }
}

export async function getMyNgo(req, res, next) {
  try {
    const ngo = await NGO.findOne({ userId: req.user.id }).populate("userId", "name phone email organization");
    if (!ngo) return next(new AppError(404, "NGO profile not found", "NGO_NOT_FOUND"));
    return res.json(ngo);
  } catch (error) { return next(error); }
}

export async function nutritionStatus(req, res, next) {
  try {
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) return next(new AppError(404, "NGO profile not found", "NGO_NOT_FOUND"));
    if (!canAccess(req, ngo)) return next(new AppError(403, "You cannot access this NGO profile", "FORBIDDEN"));
    const target = effectiveNgoNutrition(ngo);
    const log = await NgoNutritionLog.findOne({ ngoId: ngo._id, date: startOfOperationalDay() });
    const deliveredCalories = log?.deliveredCalories || 0;
    const deliveredProtein = log?.deliveredProtein || 0;
    return res.json({ targetCalories: target.caloriesPerDay, targetProtein: target.proteinGramsPerDay, targetSource: target.source, deliveredCalories, deliveredProtein, gapCalories: Math.max(0, target.caloriesPerDay - deliveredCalories), gapProtein: Math.max(0, target.proteinGramsPerDay - deliveredProtein) });
  } catch (error) { return next(error); }
}

export async function setNutritionOverride(req, res, next) {
  try {
    const ngo = await NGO.findByIdAndUpdate(req.params.id, { $set: { nutritionOverride: { caloriesPerDay: req.body.caloriesPerDay, proteinGramsPerDay: req.body.proteinGramsPerDay, reason: req.body.reason.trim(), setBy: req.user.id, setAt: new Date() } } }, { new: true, runValidators: true });
    if (!ngo) return next(new AppError(404, "NGO profile not found", "NGO_NOT_FOUND"));
    return res.json(ngo);
  } catch (error) { return next(error); }
}

export async function clearNutritionOverride(req, res, next) {
  try {
    const ngo = await NGO.findByIdAndUpdate(req.params.id, { $unset: { nutritionOverride: 1 } }, { new: true });
    if (!ngo) return next(new AppError(404, "NGO profile not found", "NGO_NOT_FOUND"));
    return res.json(ngo);
  } catch (error) { return next(error); }
}
