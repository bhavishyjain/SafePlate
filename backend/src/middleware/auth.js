import jwt from "jsonwebtoken";
import { getConfig } from "../config/env.js";
import { AppError } from "./errors.js";
import { User } from "../models/User.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const [scheme, token] = authHeader?.split(" ") || [];

  if (scheme !== "Bearer" || !token) {
    return next(new AppError(401, "Access token required", "AUTHENTICATION_REQUIRED"));
  }

  try {
    const decoded = jwt.verify(token, getConfig().jwtSecret);
    const user = await User.findById(decoded.id).select("email role isActive");
    if (!user || user.isActive === false) return next(new AppError(401, "Account is disabled or no longer exists", "ACCOUNT_DISABLED"));
    req.user = {
      id: decoded.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    return next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required", "AUTHENTICATION_REQUIRED"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Access denied for this role", "FORBIDDEN"));
    }

    next();
  };
};
