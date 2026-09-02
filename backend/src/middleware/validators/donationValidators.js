import { isExpired } from "../../utils/date.js";
import { isGeoPoint, isNonEmptyString, isPositiveNumber, isValidDate, validate } from "../validate.js";

const packaging = ["SEALED_PACKAGED", "CLOSED_CONTAINER", "OPEN_OR_BULK"];
const storage = ["ROOM_TEMPERATURE", "REFRIGERATED", "FROZEN"];
const editable = ["items", "preparedAt", "pickupDeadline", "location", "packagingType", "storageCondition"];

function itemErrors(items) {
  if (!Array.isArray(items) || items.length === 0) return [{ field: "items", message: "At least one item is required" }];
  const errors = [];
  items.forEach((item, index) => {
    if (!isNonEmptyString(item.name)) errors.push({ field: `items.${index}.name`, message: "Name is required" });
    if (!isPositiveNumber(item.quantityGrams) || item.quantityGrams < 250) errors.push({ field: `items.${index}.quantityGrams`, message: "Minimum is 250 grams" });
    if (typeof item.nutritionPer100g?.calories !== "number" || item.nutritionPer100g.calories < 0) errors.push({ field: `items.${index}.nutritionPer100g.calories`, message: "Confirmed calories are required" });
    if (typeof item.nutritionPer100g?.proteinGrams !== "number" || item.nutritionPer100g.proteinGrams < 0) errors.push({ field: `items.${index}.nutritionPer100g.proteinGrams`, message: "Confirmed protein is required" });
    if (!isPositiveNumber(item.baseShelfLifeHours)) errors.push({ field: `items.${index}.baseShelfLifeHours`, message: "Shelf life is required" });
    if (!["CATALOG", "GEMINI_ESTIMATE", "ADMIN_OVERRIDE"].includes(item.nutritionSource)) errors.push({ field: `items.${index}.nutritionSource`, message: "Nutrition source is invalid" });
    if (item.donorConfirmed !== true) errors.push({ field: `items.${index}.donorConfirmed`, message: "Donor confirmation is required" });
  });
  return errors;
}

function commonErrors(body, partial) {
  const errors = [];
  if (!partial || body.items !== undefined) errors.push(...itemErrors(body.items));
  if (!partial || body.preparedAt !== undefined) if (!isValidDate(body.preparedAt)) errors.push({ field: "preparedAt", message: "Prepared time is invalid" });
  if (!partial || body.pickupDeadline !== undefined) {
    if (!isValidDate(body.pickupDeadline)) errors.push({ field: "pickupDeadline", message: "Pickup deadline is invalid" });
    else if (isExpired(body.pickupDeadline)) errors.push({ field: "pickupDeadline", message: "Pickup deadline must be in the future" });
  }
  if (!partial || body.location !== undefined) if (!isGeoPoint(body.location)) errors.push({ field: "location", message: "Valid GeoJSON point required" });
  if (!partial || body.packagingType !== undefined) if (!packaging.includes(body.packagingType)) errors.push({ field: "packagingType", message: "Packaging type is invalid" });
  if (!partial || body.storageCondition !== undefined) if (!storage.includes(body.storageCondition)) errors.push({ field: "storageCondition", message: "Storage condition is invalid" });
  return errors;
}

export const validateDonationCreate = validate((req) => commonErrors(req.body, false));
export const validateDonationUpdate = validate((req) => {
  const fields = Object.keys(req.body);
  const errors = fields.length ? [] : [{ field: "body", message: "At least one field is required" }];
  const unknown = fields.filter((field) => !editable.includes(field));
  if (unknown.length) errors.push({ field: "body", message: `Unknown fields: ${unknown.join(", ")}` });
  return [...errors, ...commonErrors(req.body, true)];
});
export const validateDiscard = validate((req) => req.body.status === "DISCARDED" ? [] : [{ field: "status", message: "Only DISCARDED is allowed" }]);
