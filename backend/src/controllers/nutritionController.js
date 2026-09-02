import { NutritionCatalogItem } from "../models/NutritionCatalogItem.js";
import { AppError } from "../middleware/errors.js";
import { analyzeNutritionItems } from "../services/nutritionAnalysisService.js";

export async function analyze(req, res, next) {
  try { return res.json({ items: await analyzeNutritionItems(req.body.items) }); }
  catch (error) { return next(error); }
}

export async function listCatalog(_req, res, next) {
  try { return res.json(await NutritionCatalogItem.find({ active: true }).sort({ name: 1 })); }
  catch (error) { return next(error); }
}

export async function createCatalogItem(req, res, next) {
  try { return res.status(201).json(await NutritionCatalogItem.create(req.body)); }
  catch (error) { return next(error); }
}

export async function updateCatalogItem(req, res, next) {
  try {
    const item = await NutritionCatalogItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return next(new AppError(404, "Nutrition catalog item not found", "CATALOG_ITEM_NOT_FOUND"));
    return res.json(item);
  } catch (error) { return next(error); }
}
