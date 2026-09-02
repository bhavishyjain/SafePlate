import { Schema, model } from "mongoose";

const NutritionCatalogItemSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    aliases: [{ type: String, trim: true }],
    caloriesPer100g: { type: Number, required: true, min: 0 },
    proteinPer100g: { type: Number, required: true, min: 0 },
    baseShelfLifeHours: { type: Number, required: true, min: 0.1 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const NutritionCatalogItem = model("NutritionCatalogItem", NutritionCatalogItemSchema);
