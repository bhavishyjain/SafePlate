import { beneficiaryNutritionReferences } from "../../domain/nutritionReferences.js";
import { isGeoPoint, isNonEmptyString, isObjectId, isPositiveNumber, validate } from "../validate.js";

export const validateNgoProfile = validate((req) => {
  const errors = [];
  if (!["ORPHANAGE", "OLD_AGE_HOME", "SHELTER", "SCHOOL", "OTHER"].includes(req.body.type)) errors.push({ field: "type", message: "NGO type is invalid" });
  if (!isGeoPoint(req.body.location)) errors.push({ field: "location", message: "Valid GeoJSON point required" });
  if (!Array.isArray(req.body.beneficiaryGroups) || !req.body.beneficiaryGroups.length) errors.push({ field: "beneficiaryGroups", message: "At least one group is required" });
  else req.body.beneficiaryGroups.forEach((group, index) => {
    if (!beneficiaryNutritionReferences[group.category]) errors.push({ field: `beneficiaryGroups.${index}.category`, message: "Category is invalid" });
    if (!Number.isInteger(group.count) || group.count < 1) errors.push({ field: `beneficiaryGroups.${index}.count`, message: "Count must be a positive integer" });
  });
  if (req.user?.role === "ADMIN" && !isObjectId(req.body.userId)) errors.push({ field: "userId", message: "Admin must specify an NGO user" });
  return errors;
});

export const validateNutritionOverride = validate((req) => {
  const errors = [];
  if (!isPositiveNumber(req.body.caloriesPerDay)) errors.push({ field: "caloriesPerDay", message: "Must be positive" });
  if (!isPositiveNumber(req.body.proteinGramsPerDay)) errors.push({ field: "proteinGramsPerDay", message: "Must be positive" });
  if (!isNonEmptyString(req.body.reason)) errors.push({ field: "reason", message: "Override reason is required" });
  return errors;
});
