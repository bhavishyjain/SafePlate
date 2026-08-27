import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validateObjectIdParam } from "../middleware/validate.js";
import { confirmDelivery, confirmPickup, listAllocations } from "../controllers/allocationController.js";
const router = Router();
router.get("/", authenticateToken, listAllocations);
router.patch("/:id/pickup", authenticateToken, requireRole(["NGO", "ADMIN"]), validateObjectIdParam(), confirmPickup);
router.patch("/:id/delivered", authenticateToken, requireRole(["NGO", "ADMIN"]), validateObjectIdParam(), confirmDelivery);
export default router;
