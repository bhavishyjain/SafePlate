import { Router } from "express";
import { Donation } from "../models/Donation.js";
import { NGO } from "../models/NGO.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /dashboard/summary (Admin only)
router.get("/summary", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const totalDonations = await Donation.find();
    
    let kgDonated = 0;
    let kgDelivered = 0;
    let kgDiscarded = 0;
    let totalRiskScore = 0;

    for (const d of totalDonations) {
      kgDonated += d.quantityKg;
      totalRiskScore += d.riskScore;

      if (d.status === "DELIVERED") {
        kgDelivered += d.quantityKg;
      } else if (d.status === "DISCARDED") {
        kgDiscarded += d.quantityKg;
      }
    }

    const avgRisk = totalDonations.length > 0 ? totalRiskScore / totalDonations.length : 0;
    const ngosServedCount = await NGO.countDocuments();

    return res.json({
      kgDonated,
      kgDelivered,
      kgDiscarded,
      avgSpoilageRisk: avgRisk,
      ngosServed: ngosServedCount,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
