import { validate } from "../validate.js";

export const validateAccountStatus = validate((req) => typeof req.body.isActive === "boolean" ? [] : [{ field: "isActive", message: "isActive must be a boolean" }]);
