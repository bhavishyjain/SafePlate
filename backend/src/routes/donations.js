import { Router } from "express";
import { Donation } from "../models/Donation.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// POST /donations (Donor only)
router.post("/", authenticateToken, requireRole(["DONOR"]), async (req, res) => {
  try {
    const { foodType, quantityKg, preparedAt, pickupDeadline, location, packagingType, storageCondition } = req.body;

    const newDonation = new Donation({
      donorId: req.user?.id,
      foodType,
      quantityKg,
      preparedAt,
      pickupDeadline,
      location,
      packagingType,
      storageCondition,
      status: "PENDING",
      riskScore: 0,
    });

    await newDonation.save();
    return res.status(201).json(newDonation);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /donations (Donor: own; Admin: all)
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user?.role === "ADMIN") {
      const donations = await Donation.find().populate("donorId", "name email").populate("foodType");
      return res.json(donations);
    } else if (req.user?.role === "DONOR") {
      const donations = await Donation.find({ donorId: req.user.id }).populate("foodType");
      return res.json(donations);
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /donations/:id
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate("donorId", "name phone email").populate("foodType");
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }
    return res.json(donation);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
