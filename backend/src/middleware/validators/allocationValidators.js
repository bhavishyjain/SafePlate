import { isNonEmptyString, isObjectId, validate } from "../validate.js";

export const validateReason = validate((req) => isNonEmptyString(req.body.reason) ? [] : [{ field: "reason", message: "Reason is required" }]);

export const validateReassignment = validate((req) => {
  const errors = [];
  if (!isObjectId(req.body.ngoId)) errors.push({ field: "ngoId", message: "A valid NGO identifier is required" });
  if (!isNonEmptyString(req.body.reason)) errors.push({ field: "reason", message: "Reason is required" });
  return errors;
});
