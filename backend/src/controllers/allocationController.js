import { Allocation } from "../models/Allocation.js";
import { Donation } from "../models/Donation.js";
import { NGO } from "../models/NGO.js";
import { NgoNutritionLog } from "../models/NgoNutritionLog.js";
import { AppError } from "../middleware/errors.js";
import { startOfOperationalDay } from "../utils/date.js";

export async function listAllocations(req, res, next) {
  try {
    if (req.user.role === "ADMIN") return res.json(await Allocation.find().populate("donationId").populate("ngoId"));
    if (req.user.role === "NGO") {
      const ngo = await NGO.findOne({ userId: req.user.id });
      if (!ngo) return next(new AppError(404, "NGO profile not found", "NGO_NOT_FOUND"));
      return res.json(await Allocation.find({ ngoId: ngo._id }).populate("donationId"));
    }
    return next(new AppError(403, "Access denied for this role", "FORBIDDEN"));
  } catch (error) { return next(error); }
}

export async function confirmPickup(req, res, next) {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return next(new AppError(404, "Allocation not found", "ALLOCATION_NOT_FOUND"));
    allocation.pickupConfirmedAt = new Date(); await allocation.save();
    await Donation.findByIdAndUpdate(allocation.donationId, { status: "PICKED_UP" });
    return res.json({ message: "Donation status marked as PICKED_UP", allocation });
  } catch (error) { return next(error); }
}

export async function confirmDelivery(req, res, next) {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return next(new AppError(404, "Allocation not found", "ALLOCATION_NOT_FOUND"));
    allocation.deliveredConfirmedAt = new Date(); await allocation.save();
    const donation = await Donation.findByIdAndUpdate(allocation.donationId, { status: "DELIVERED" }, { new: true });
    if (donation) {
      const totals = donation.items.reduce((sum, item) => { const units = item.quantityGrams / 100; sum.calories += item.nutritionPer100g.calories * units; sum.protein += item.nutritionPer100g.proteinGrams * units; return sum; }, { calories: 0, protein: 0 });
      await NgoNutritionLog.findOneAndUpdate({ ngoId: allocation.ngoId, date: startOfOperationalDay() }, { $inc: { deliveredCalories: totals.calories, deliveredProtein: totals.protein } }, { upsert: true, new: true });
    }
    return res.json({ message: "Donation status marked as DELIVERED", allocation });
  } catch (error) { return next(error); }
}
