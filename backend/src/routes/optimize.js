import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { optimize } from "../controllers/optimizeController.js";
const router = Router();
router.post("/", authenticateToken, requireRole(["ADMIN"]), optimize);
export default router;
