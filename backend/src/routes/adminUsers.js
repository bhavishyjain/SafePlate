import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validateObjectIdParam } from "../middleware/validate.js";
import { listUsers, revokeUserSessions, setUserStatus } from "../controllers/adminUserController.js";
import { validateAccountStatus } from "../middleware/validators/adminValidators.js";

const router = Router();
router.use(authenticateToken, requireRole(["ADMIN"]));
router.get("/", listUsers);
router.patch("/:id/status", validateObjectIdParam(), validateAccountStatus, setUserStatus);
router.post("/:id/revoke-sessions", validateObjectIdParam(), revokeUserSessions);
export default router;
