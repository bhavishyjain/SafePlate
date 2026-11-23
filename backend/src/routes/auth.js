import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { forgotPassword, login, logout, logoutAll, me, refresh, register, resetPassword, updateMe } from "../controllers/authController.js";
import { validateForgotPassword, validateLogin, validateProfileUpdate, validateRefreshToken, validateRegistration, validateResetPassword } from "../middleware/validators/authValidators.js";

const router = Router();

router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.post("/refresh", validateRefreshToken, refresh);
router.post("/logout", validateRefreshToken, logout);
router.post("/logout-all", authenticateToken, logoutAll);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);
router.get("/me", authenticateToken, me);
router.patch("/me", authenticateToken, validateProfileUpdate, updateMe);

export default router;
