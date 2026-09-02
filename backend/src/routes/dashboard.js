import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { summary } from "../controllers/dashboardController.js";
const router = Router();
router.get("/summary", authenticateToken, requireRole(["ADMIN"]), summary);
export default router;
