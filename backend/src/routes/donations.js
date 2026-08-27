import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validateObjectIdParam } from "../middleware/validate.js";
import { createDonation, discardDonation, getDonation, listDonations, updateDonation } from "../controllers/donationController.js";
import { validateDiscard, validateDonationCreate, validateDonationUpdate } from "../middleware/validators/donationValidators.js";

const router = Router();
router.post("/", authenticateToken, requireRole(["DONOR"]), validateDonationCreate, createDonation);
router.get("/", authenticateToken, listDonations);
router.get("/:id", authenticateToken, validateObjectIdParam(), getDonation);
router.patch("/:id", authenticateToken, requireRole(["DONOR", "ADMIN"]), validateObjectIdParam(), validateDonationUpdate, updateDonation);
router.patch("/:id/status", authenticateToken, requireRole(["DONOR", "ADMIN"]), validateObjectIdParam(), validateDiscard, discardDonation);
export default router;
