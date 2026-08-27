import { isNonEmptyString, isPositiveNumber, validate } from "../validate.js";

export const validateAnalysis = validate((req) => {
  const errors = [];
  if (!Array.isArray(req.body.items) || req.body.items.length === 0) return [{ field: "items", message: "At least one item is required" }];
  req.body.items.forEach((item, index) => {
    if (!isNonEmptyString(item.name)) errors.push({ field: `items.${index}.name`, message: "Name is required" });
    if (!isPositiveNumber(item.quantityGrams) || item.quantityGrams < 250) errors.push({ field: `items.${index}.quantityGrams`, message: "Each item must weigh at least 250 grams" });
  });
  return errors;
});

export const validateCatalogItem = validate((req) => {
  const errors = [];
  if (req.body.name !== undefined && !isNonEmptyString(req.body.name)) errors.push({ field: "name", message: "Name is invalid" });
  for (const field of ["caloriesPer100g", "proteinPer100g"]) if (req.body[field] !== undefined && (typeof req.body[field] !== "number" || req.body[field] < 0)) errors.push({ field, message: "Must be zero or greater" });
  if (req.body.baseShelfLifeHours !== undefined && !isPositiveNumber(req.body.baseShelfLifeHours)) errors.push({ field: "baseShelfLifeHours", message: "Must be positive" });
  return errors;
});
