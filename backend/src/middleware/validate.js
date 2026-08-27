import mongoose from "mongoose";
import { AppError } from "./errors.js";

export const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
export const isEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isPositiveNumber = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
export const isObjectId = (value) => mongoose.isValidObjectId(value);
export const isValidDate = (value) => value !== undefined && !Number.isNaN(new Date(value).getTime());

export function isGeoPoint(value) {
  if (value?.type !== "Point" || !Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
    return false;
  }
  const [longitude, latitude] = value.coordinates;
  return (
    typeof longitude === "number" &&
    typeof latitude === "number" &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

export function validate(validator) {
  return (req, _res, next) => {
    const errors = validator(req);
    if (errors.length > 0) {
      return next(new AppError(400, "Request validation failed", "VALIDATION_ERROR", errors));
    }
    return next();
  };
}

export function validateObjectIdParam(parameterName = "id") {
  return (req, _res, next) => {
    if (!isObjectId(req.params[parameterName])) {
      return next(
        new AppError(400, `${parameterName} must be a valid identifier`, "INVALID_IDENTIFIER")
      );
    }
    return next();
  };
}
