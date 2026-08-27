import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validateObjectIdParam } from "../middleware/validate.js";
import { clearNutritionOverride, getNgo, nutritionStatus, setNutritionOverride, upsertNgo } from "../controllers/ngoController.js";
import { validateNgoProfile, validateNutritionOverride } from "../middleware/validators/ngoValidators.js";

const router = Router();
router.post("/", authenticateToken, requireRole(["NGO", "ADMIN"]), validateNgoProfile, upsertNgo);
router.get("/:id", authenticateToken, validateObjectIdParam(), getNgo);
router.get("/:id/nutrition-status", authenticateToken, validateObjectIdParam(), nutritionStatus);
router.patch("/:id/nutrition-override", authenticateToken, requireRole(["ADMIN"]), validateObjectIdParam(), validateNutritionOverride, setNutritionOverride);
router.delete("/:id/nutrition-override", authenticateToken, requireRole(["ADMIN"]), validateObjectIdParam(), clearNutritionOverride);
export default router;
