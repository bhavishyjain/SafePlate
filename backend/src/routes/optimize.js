import { Router } from "express";
import { Donation } from "../models/Donation.js";
import { NGO } from "../models/NGO.js";
import { Allocation } from "../models/Allocation.js";
import { runHeuristicAllocation } from "../engines/AllocationEngine.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// POST /optimize (Admin only)
router.post("/", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const pendingDonations = await Donation.find({ status: "PENDING" });
    const ngos = await NGO.find();

    const proposals = runHeuristicAllocation(pendingDonations, ngos);

    const createdAllocations = [];
    for (const prop of proposals) {
      const alloc = new Allocation({
        donationId: prop.donationId,
        ngoId: prop.ngoId,
        matchScore: prop.matchScore,
      });
      await alloc.save();

      await Donation.findByIdAndUpdate(prop.donationId, { status: "ASSIGNED" });
      createdAllocations.push(alloc);
    }

    return res.json({
      message: "Allocation engine executed successfully",
      allocationsCreatedCount: createdAllocations.length,
      allocations: createdAllocations,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
