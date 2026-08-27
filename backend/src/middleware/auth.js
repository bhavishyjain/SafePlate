import jwt from "jsonwebtoken";
import { getConfig } from "../config/env.js";
import { AppError } from "./errors.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const [scheme, token] = authHeader?.split(" ") || [];

  if (scheme !== "Bearer" || !token) {
    return next(new AppError(401, "Access token required", "AUTHENTICATION_REQUIRED"));
  }

  try {
    const decoded = jwt.verify(token, getConfig().jwtSecret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
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
