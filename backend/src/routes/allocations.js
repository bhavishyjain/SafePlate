import { Router } from "express";
import { Allocation } from "../models/Allocation.js";
import { Donation } from "../models/Donation.js";
import { NGO } from "../models/NGO.js";
import { NgoNutritionLog } from "../models/NgoNutritionLog.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /allocations (NGO: own; Admin: all)
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user?.role === "ADMIN") {
      const allocations = await Allocation.find().populate("donationId").populate("ngoId");
      return res.json(allocations);
    } else if (req.user?.role === "NGO") {
      const ngoProfile = await NGO.findOne({ userId: req.user.id });
      if (!ngoProfile) {
        return res.status(404).json({ message: "NGO profile not found" });
      }
      const allocations = await Allocation.find({ ngoId: ngoProfile._id }).populate("donationId");
      return res.json(allocations);
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /allocations/:id/pickup (NGO marks picked up)
router.patch("/:id/pickup", authenticateToken, requireRole(["NGO", "ADMIN"]), async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    allocation.pickupConfirmedAt = new Date();
    await allocation.save();

    await Donation.findByIdAndUpdate(allocation.donationId, { status: "PICKED_UP" });

    return res.json({ message: "Donation status marked as PICKED_UP", allocation });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /allocations/:id/delivered (NGO marks delivered, logs nutrition data)
router.patch("/:id/delivered", authenticateToken, requireRole(["NGO", "ADMIN"]), async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    allocation.deliveredConfirmedAt = new Date();
    await allocation.save();

    const donation = await Donation.findByIdAndUpdate(allocation.donationId, { status: "DELIVERED" }).populate("foodType");

    if (donation && donation.foodType) {
      const food = donation.foodType;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const caloriesAdded = food.caloriesPer100g * donation.quantityKg * 10;
      const proteinAdded = food.proteinPer100g * donation.quantityKg * 10;

      await NgoNutritionLog.findOneAndUpdate(
        { ngoId: allocation.ngoId, date: today },
        { $inc: { deliveredCalories: caloriesAdded, deliveredProtein: proteinAdded } },
        { upsert: true, new: true }
      );
    }

    return res.json({ message: "Donation status marked as DELIVERED", allocation });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
