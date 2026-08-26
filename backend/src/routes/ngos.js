import { Router } from "express";
import { NGO } from "../models/NGO.js";
import { NgoNutritionLog } from "../models/NgoNutritionLog.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// POST /ngos (NGO or Admin can setup profile)
router.post("/", authenticateToken, requireRole(["NGO", "ADMIN"]), async (req, res) => {
  try {
    const { type, location, capacity, targetCaloriesPerDay, targetProteinPerDay } = req.body;
    
    let ngoProfile = await NGO.findOne({ userId: req.user?.id });

    if (ngoProfile) {
      ngoProfile.type = type;
      ngoProfile.location = location;
      ngoProfile.capacity = capacity;
      ngoProfile.targetCaloriesPerDay = targetCaloriesPerDay;
      ngoProfile.targetProteinPerDay = targetProteinPerDay;
      await ngoProfile.save();
    } else {
      ngoProfile = new NGO({
        userId: req.user?.id,
        type,
        location,
        capacity,
        targetCaloriesPerDay,
        targetProteinPerDay,
      });
      await ngoProfile.save();
    }

    return res.status(201).json(ngoProfile);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /ngos/:id
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id).populate("userId", "name phone email");
    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }
    return res.json(ngo);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /ngos/:id/nutrition-status (today's nutrition gap metrics)
router.get("/:id/nutrition-status", authenticateToken, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await NgoNutritionLog.findOne({ ngoId: ngo._id, date: today });
    const deliveredCalories = log?.deliveredCalories || 0;
    const deliveredProtein = log?.deliveredProtein || 0;

    const gapCalories = Math.max(0, ngo.targetCaloriesPerDay - deliveredCalories);
    const gapProtein = Math.max(0, ngo.targetProteinPerDay - deliveredProtein);

    return res.json({
      targetCalories: ngo.targetCaloriesPerDay,
      targetProtein: ngo.targetProteinPerDay,
      deliveredCalories,
      deliveredProtein,
      gapCalories,
      gapProtein,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
