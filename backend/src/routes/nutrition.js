import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validateObjectIdParam } from "../middleware/validate.js";
import { analyze, createCatalogItem, listCatalog, updateCatalogItem } from "../controllers/nutritionController.js";
import { validateAnalysis, validateCatalogItem } from "../middleware/validators/nutritionValidators.js";

const router = Router();
router.post("/analyze", authenticateToken, requireRole(["DONOR", "ADMIN"]), validateAnalysis, analyze);
router.get("/catalog", authenticateToken, listCatalog);
router.post("/catalog", authenticateToken, requireRole(["ADMIN"]), validateCatalogItem, createCatalogItem);
router.patch("/catalog/:id", authenticateToken, requireRole(["ADMIN"]), validateObjectIdParam(), validateCatalogItem, updateCatalogItem);
export default router;
