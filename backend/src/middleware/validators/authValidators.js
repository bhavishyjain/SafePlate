import { isEmail, isNonEmptyString, validate } from "../validate.js";

export const validateRegistration = validate((req) => {
  const { name, phone, email, password, role } = req.body;
  const errors = [];
  if (!isNonEmptyString(name)) errors.push({ field: "name", message: "Name is required" });
  if (!isNonEmptyString(phone) || phone.trim().length < 7) errors.push({ field: "phone", message: "A valid phone number is required" });
  if (!isEmail(email)) errors.push({ field: "email", message: "A valid email is required" });
  if (typeof password !== "string" || password.length < 8) errors.push({ field: "password", message: "Password must contain at least 8 characters" });
  if (!["DONOR", "NGO"].includes(role)) errors.push({ field: "role", message: "Role must be DONOR or NGO" });
  return errors;
});

export const validateLogin = validate((req) => {
  const errors = [];
  if (!isEmail(req.body.email)) errors.push({ field: "email", message: "A valid email is required" });
  if (!isNonEmptyString(req.body.password)) errors.push({ field: "password", message: "Password is required" });
  if (req.body.role !== undefined && !["DONOR", "NGO", "ADMIN"].includes(req.body.role)) errors.push({ field: "role", message: "Role is invalid" });
  return errors;
});

export const validateRefreshToken = validate((req) => isNonEmptyString(req.body.refreshToken) ? [] : [{ field: "refreshToken", message: "Refresh token is required" }]);
export const validateForgotPassword = validate((req) => isEmail(req.body.email) ? [] : [{ field: "email", message: "A valid email is required" }]);
export const validateResetPassword = validate((req) => {
  const errors = [];
  if (!isNonEmptyString(req.body.token)) errors.push({ field: "token", message: "Reset token is required" });
  if (typeof req.body.password !== "string" || req.body.password.length < 8) errors.push({ field: "password", message: "Password must contain at least 8 characters" });
  return errors;
});
